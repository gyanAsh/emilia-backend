import {
  FRONTEND_URL,
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REDIRECT_URI,
} from "../../configs/constants.ts";
import { arctic, Context } from "../../deps.ts";
import process from "node:process";
import { createToken } from "../../utils/jwt.ts";
import { fetchEmails } from "../../utils/gmail-emails.ts";

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
      "openid",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.compose",
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
      sameSite: "lax",
    });

    await ctx.cookies.set("code_verifier", codeVerifier, {
      secure: process.env.NODE_ENV === "production", // Set to false for localhost
      path: "/auth/login/google",
      httpOnly: true,
      maxAge: 600, // 10 minutes in seconds
      sameSite: "lax",
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
    const google_tokens = await google.validateAuthorizationCode(
      code,
      storedCodeVerifier
    );

    const accessToken = google_tokens.accessToken();

    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const emails = await fetchEmails(accessToken);
    const user = await userResponse.json();
    const jwt = await createToken(user.id);

    const exchange_code = crypto.randomUUID();

    console.log("Add these data to db and exchange_code", {
      emails,
      user,
      jwt,
    });
    ctx.response.redirect(
      `${FRONTEND_URL}/auth/callback?code=${exchange_code}`
    );
  } catch (e) {
    console.error("Error in auth callback:", e);
    if (e instanceof arctic.OAuth2RequestError) {
      // Invalid authorization code, credentials, or redirect URI
      const code = e.code;
      console.warn({ code });
    }
    if (e instanceof arctic.ArcticFetchError) {
      // Failed to call `fetch()`
      const cause = e.cause;
      console.warn({ cause });
    }
    if (e instanceof arctic.UnexpectedResponseError) {
      // Indicates an unexpected response status or unexpected response body content type.
      const res_error = e.cause;
      console.warn({ res_error });
    }

    if (e instanceof arctic.UnexpectedErrorResponseBodyError) {
      // Indicates an unexpected error response JSON body.
      const res_error_body = e.cause;
      console.warn({ res_error_body });
    }

    //TODO: to keep the backend endpoint safe, if auth fails,redirect user to frontend and show auth-failed there
    ctx.response.status = 500;
    ctx.response.body = { "Authentication failed": JSON.stringify(e) };
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

    const data = ""; // Fetch data from db based on exchange_code

    if (!data) throw new Error("No Code Found for exchange.");

    const exchange_data = JSON.parse(data);

    if (exchange_data.exchange_code !== code)
      throw new Error("Invalid Code : Code missmatch");

    // Redirect the user to Google's consent screen.
    ctx.response.body = exchange_data.jwt;
  } catch (error: any) {
    ctx.response.status = 400;

    ctx.response.body = { message: error.message };
  }
};
