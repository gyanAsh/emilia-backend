export const APP_PORT = parseInt(Deno.env.get("PORT") || "8000");
export const JWT_SECRET = Deno.env.get("JWT_SECRET") || "";
export const JWT_EXP = 60 * 60 * 24 * 7; // 7 days
export const GMAIL_CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID") || "";
export const GMAIL_CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET") || "";
export const GMAIL_REDIRECT_URI =
  Deno.env.get("GMAIL_REDIRECT_URI") ||
  "http://localhost:8000/auth/login/google/callback";
export const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || " ";
