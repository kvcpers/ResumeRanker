import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getResumesByUserId, getResumeById, getResumeScore, getGlobalRankings, getTotalResumeCount, getUserByEmail, createUser, createSession, deleteSession, getLeaderboardStats } from "./db";
import { hashPassword, verifyPassword, createSessionToken } from "./_core/auth";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6, "Password must be at least 6 characters"),
        name: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check if user already exists
        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new Error("User with this email already exists");
        }

        // Hash password
        const passwordHash = await hashPassword(input.password);

        // Create user
        const user = await createUser(input.email, passwordHash, input.name);
        if (!user) {
          throw new Error("Failed to create user");
        }

        // Create session token
        const token = await createSessionToken(user.id, user.email);
        const expiresAt = new Date(Date.now() + ONE_YEAR_MS);
        await createSession(user.id, token, expiresAt);

        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Get user by email
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        // Verify password
        const isValid = await verifyPassword(input.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        // Create session token
        const token = await createSessionToken(user.id, user.email);
        const expiresAt = new Date(Date.now() + ONE_YEAR_MS);
        await createSession(user.id, token, expiresAt);

        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        };
      }),

    logout: publicProcedure.mutation(async ({ ctx }) => {
      // Get token from cookie
      const cookies = ctx.req.headers.cookie || "";
      const cookieMatch = cookies.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
      const token = cookieMatch ? cookieMatch[1] : null;
      
      if (token) {
        await deleteSession(token);
      }

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  resume: router({
    upload: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileUrl: z.string(),
        fileKey: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // This is a placeholder - actual file upload handling would be done via multipart
        return {
          success: true,
          message: "Resume uploaded successfully",
        };
      }),

    list: protectedProcedure
      .query(async ({ ctx }) => {
        const resumes = await getResumesByUserId(ctx.user.id);
        return resumes || [];
      }),

    getById: protectedProcedure
      .input(z.object({ resumeId: z.number() }))
      .query(async ({ input, ctx }) => {
        const resume = await getResumeById(input.resumeId);
        if (!resume || resume.userId !== ctx.user.id) {
          throw new Error("Resume not found or access denied");
        }
        return resume;
      }),

    getScore: protectedProcedure
      .input(z.object({ resumeId: z.number() }))
      .query(async ({ input, ctx }) => {
        const resume = await getResumeById(input.resumeId);
        if (!resume || resume.userId !== ctx.user.id) {
          throw new Error("Resume not found or access denied");
        }
        const score = await getResumeScore(input.resumeId);
        return score;
      }),

    getLeaderboard: publicProcedure
      .input(z.object({
        limit: z.number().default(100),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        const rankings = await getGlobalRankings(input.limit, input.offset);
        const stats = await getLeaderboardStats();
        return {
          rankings: rankings || [],
          total: stats.total,
          avgScore: stats.avgScore,
          topScore: stats.topScore,
          scoreDistribution: stats.scoreDistribution,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
