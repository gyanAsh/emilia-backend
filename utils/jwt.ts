import { JWT_EXP, JWT_SECRET } from "../configs/constants.ts";
import { create, verify, Payload } from "../deps.ts";

/**
 *  Using the native Web Crypto API to generate a secure CryptoKey.
 */

const getKey = async (): Promise<CryptoKey> => {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }

  // Convert the secret string to a Uint8Array
  const keyData = new TextEncoder().encode(JWT_SECRET);
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  return key;
};

/**
 * Creates a JWT token for a user
 * @param userId - The user's unique identifier
 * @returns A JWT token string
 */
export const createToken = async (userId: string): Promise<string> => {
  const payload: Payload = {
    sub: userId,
    exp: Date.now() / 1000 + JWT_EXP, // 7 days
  };
  const crypto_key = await getKey();
  return await create({ alg: "HS512", typ: "JWT" }, payload, crypto_key);
};

/**
 * Verifies and decodes a JWT token
 * @param token - The JWT token to verify
 * @returns The decoded payload or null if invalid
 */
export const verifyToken = async (token: string): Promise<Payload | null> => {
  try {
    const crypto_key = await getKey();
    return await verify(token, crypto_key);
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
};
