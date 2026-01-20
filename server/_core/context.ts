import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import * as db from "../db";
import { verifySessionToken } from "./auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Get session token from cookie
  const cookies = opts.req.headers.cookie || "";
  const cookieMatch = cookies.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  const token = cookieMatch ? cookieMatch[1] : null;
  
  if (token) {
    // Verify JWT token
    const sessionData = await verifySessionToken(token);
    
    if (sessionData) {
      // Verify session exists in database and is not expired
      const session = await db.getSessionByToken(token);
      
      if (session) {
        // Get user from database
        user = await db.getUserById(sessionData.userId);
        
        if (user) {
          // Update last signed in time
          await db.updateUserLastSignedIn(user.id);
        }
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
