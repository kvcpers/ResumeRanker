import bcrypt from "bcrypt";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a session token (JWT)
 */
export async function createSessionToken(userId: number, email: string): Promise<string> {
  const secretKey = new TextEncoder().encode(JWT_SECRET);
  const issuedAt = Date.now();
  const expiresInMs = ONE_YEAR_MS;
  const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);

  return new SignJWT({
    userId,
    email,
    sessionId: nanoid(),
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .setIssuedAt(Math.floor(issuedAt / 1000))
    .sign(secretKey);
}

/**
 * Verify and decode a session token
 */
export async function verifySessionToken(token: string): Promise<{ userId: number; email: string; sessionId: string } | null> {
  try {
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    const { userId, email, sessionId } = payload as Record<string, unknown>;

    if (
      typeof userId !== "number" ||
      typeof email !== "string" ||
      typeof sessionId !== "string"
    ) {
      return null;
    }

    return { userId, email, sessionId };
  } catch (error) {
    return null;
  }
}
