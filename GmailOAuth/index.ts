import { google } from "npm:googleapis";

// Gmail API OAuth 2.0 configuration
export const oauth2Client = new google.auth.OAuth2(
  Deno.env.get("CLIENT_ID"),
  Deno.env.get("CLIENT_SECRET"),
  "http://localhost:3000/auth/callback" // Your redirect URI
);
