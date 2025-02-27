import {
  FRONTEND_URL,
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REDIRECT_URI,
} from "../../configs/constants.ts";
import { arctic, Context } from "../../deps.ts";
import process from "node:process";
import { createToken } from "../../utils/jwt.ts";

const google = new arctic.Google(
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REDIRECT_URI
);

/**
 * Handles user OAuth login with gmail access
 */
export const googleAuth = async (ctx: Context) => {
  try {
    // Generate a state value (store it securely in production)
    const state = arctic.generateState();
    const codeVerifier = arctic.generateCodeVerifier();

    // Specify the scopes you want (Google accepts scopes as space-separated strings)
    const scopes = [
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.compose", // optional
    ];
    // Create the authorization URL using Arctic's helper.
    const authorizationUrl = google.createAuthorizationURL(
      state,
      codeVerifier,
      scopes
    );

    await ctx.cookies.set("state", state, {
      secure: process.env.NODE_ENV === "production", // Set to false for localhost
      path: "/auth/login/google",
      httpOnly: true,
      maxAge: 600, // 10 minutes in seconds
      sameSite: "strict",
    });

    await ctx.cookies.set("code_verifier", codeVerifier, {
      secure: process.env.NODE_ENV === "production", // Set to false for localhost
      path: "/auth/login/google",
      httpOnly: true,
      maxAge: 600, // 10 minutes in seconds
      sameSite: "strict",
    });

    // Redirect the user to Google's consent screen.
    return ctx.response.redirect(authorizationUrl);
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = { message: error };
  }
};

/**
 * Handles user OAuth Google Callback
 */
export const googleAuthCallback = async (ctx: Context) => {
  const url = ctx.request.url;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  // In production, also verify the "state" parameter.
  if (!code) {
    ctx.response.status = 400;
    ctx.response.body = "Missing authorization code";
    return;
  }
  try {
    const storedState = await ctx.cookies.get("state");
    const storedCodeVerifier = await ctx.cookies.get("code_verifier");

    if (!code || !storedState || state !== storedState || !storedCodeVerifier) {
      throw new Error("Invalid request");
    }

    // Exchange the authorization code for tokens using Arctic.
    const tokens = await google.validateAuthorizationCode(
      code,
      storedCodeVerifier
    );
    // Get user profile with access token
    const accessToken = tokens.accessToken();
    // Fetch user info here.
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const user = await userResponse.json();
    console.log({ user });
    const jwt = await createToken(user.id);

    const exchangeCode = crypto.randomUUID(); // Generate a unique code
    // Store this code with the user's JWT in a temporary cache with short expiration
    await ctx.cookies.set(exchangeCode, jwt, {
      secure: process.env.NODE_ENV === "production", // Set to false for localhost
      path: "/auth/login/google",
      httpOnly: true,
      maxAge: 120, // 2 minutes in seconds
      sameSite: "strict",
    });

    // Redirect with the code instead of the token
    ctx.response.redirect(`${FRONTEND_URL}/auth/callback?code=${exchangeCode}`);
    // Return the JWT (and optionally the tokens from Google).
    // ctx.response.body = jwt;
  } catch (error) {
    console.error("Error in auth callback:", error);
    ctx.response.status = 500;
    ctx.response.body = { "Authentication failed": error };
  }
};

/**
 * Returns jwt token in exchange of code.
 */
export const googleAuthExchangeCode = async (ctx: Context) => {
  const url = ctx.request.url;
  const code = url.searchParams.get("code") || "";
  try {
    if (!code) throw new Error("Missing Code");

    const jwt = await ctx.cookies.get(code);

    if (!jwt) throw new Error("Invalid Code");

    // Redirect the user to Google's consent screen.
    return (ctx.response.body = jwt);
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = { message: error };
  }
};
