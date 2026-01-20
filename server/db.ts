import { eq, desc, and, gt, count, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { nanoid } from "nanoid";
import { InsertUser, InsertSession, users, sessions, resumes, resumeScores, biasFlags, recommendations, resumeEducation, resumeExperience, resumeSkills, resumeActivities } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      console.error("[Database] ❌ DATABASE_URL is not set");
      console.error("[Database] On Heroku, set it with: heroku config:set DATABASE_URL='your-connection-string'");
      return null;
    }
    try {
      // Force IPv4 connection (Heroku doesn't support IPv6 to external databases)
      // Parse the connection string and ensure we use IPv4
      let connectionString = process.env.DATABASE_URL;
      
      // If the connection string contains an IPv6 address, we need to use the hostname instead
      // Supabase provides both IPv4 and IPv6, but Heroku can only reach IPv4
      if (connectionString) {
        // Replace IPv6 addresses with hostname (Supabase hostname)
        connectionString = connectionString.replace(/@\[([^\]]+)\]:/, '@$1:');
        // Ensure we're using the hostname format
        const hostnameMatch = connectionString.match(/@([^:]+):/);
        if (hostnameMatch && hostnameMatch[1].includes('supabase.co')) {
          // Already using hostname, good
        }
      }
      
      const client = postgres(connectionString, {
        max: 1, // Limit connections for serverless environments
        idle_timeout: 20,
        connect_timeout: 10,
        // Force IPv4 by using the hostname resolution
        // The postgres library will resolve the hostname to IPv4
      });
      _db = drizzle(client);
      // Test connection
      await client`SELECT 1`;
      console.log("[Database] ✅ Connected successfully to PostgreSQL");
    } catch (error) {
      console.error("[Database] ❌ Failed to connect:", error);
      console.error("[Database] DATABASE_URL:", process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 20)}...` : "not set");
      if (error instanceof Error) {
        console.error("[Database] Error message:", error.message);
      }
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // Build values object with required fields
    const values: InsertUser = {
      openId: user.openId,
      email: user.email || "",
      passwordHash: user.passwordHash || "",
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      if (field === "email" && normalized) {
        values.email = normalized;
      } else {
        (values as any)[field] = normalized;
      }
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.passwordHash) {
      values.passwordHash = user.passwordHash;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // PostgreSQL uses ON CONFLICT instead of onDuplicateKeyUpdate
    // Note: onConflictDoUpdate requires all required fields in values
    await db.insert(users).values(values as InsertUser).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * User authentication operations
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(email: string, passwordHash: string, name?: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const openId = `user-${nanoid()}`;
  const result = await db.insert(users).values({
    openId,
    email,
    passwordHash,
    name: name || null,
    loginMethod: "email",
    role: "user",
    lastSignedIn: new Date(),
  }).returning();

  if (result.length === 0) {
    throw new Error("Failed to create user");
  }

  return result[0];
}

export async function updateUserLastSignedIn(userId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, userId));
}

/**
 * Session operations
 */
export async function createSession(userId: number, token: string, expiresAt: Date) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(sessions).values({
    userId,
    token,
    expiresAt,
  });
}

export async function getSessionByToken(token: string) {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const now = new Date();
  const result = await db
    .select()
    .from(sessions)
    .where(and(
      eq(sessions.token, token),
      gt(sessions.expiresAt, now)
    ))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function deleteSession(token: string) {
  const db = await getDb();
  if (!db) return;

  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function deleteUserSessions(userId: number) {
  const db = await getDb();
  if (!db) return;

  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/**
 * Resume operations
 */
export async function createResume(userId: number, fileName: string, fileKey: string, fileUrl: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(resumes).values({
    userId,
    fileName,
    fileKey,
    fileUrl,
    parsingStatus: "pending",
  }).returning();
  
  return result[0];
}

export async function getResumesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(resumes).where(eq(resumes.userId, userId)).orderBy(desc(resumes.createdAt));
}

export async function getResumeById(resumeId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(resumes).where(eq(resumes.id, resumeId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateResumeParsingStatus(resumeId: number, status: "pending" | "parsing" | "completed" | "failed", error?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { parsingStatus: status };
  if (error) updateData.parsingError = error;
  
  return await db.update(resumes).set(updateData).where(eq(resumes.id, resumeId));
}

export async function updateResumeRawText(resumeId: number, rawText: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(resumes).set({ rawText }).where(eq(resumes.id, resumeId));
}

/**
 * Resume score operations
 */
export async function getResumeScore(resumeId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(resumeScores).where(eq(resumeScores.resumeId, resumeId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createOrUpdateResumeScore(resumeId: number, userId: number, scoreData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getResumeScore(resumeId);
  if (existing) {
    return await db.update(resumeScores).set(scoreData).where(eq(resumeScores.resumeId, resumeId));
  } else {
    return await db.insert(resumeScores).values({
      resumeId,
      userId,
      ...scoreData,
    });
  }
}

export async function getGlobalRankings(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  // Get rankings with resume info
  const result = await db
    .select({
      id: resumeScores.id,
      resumeId: resumeScores.resumeId,
      userId: resumeScores.userId,
      overallScore: resumeScores.overallScore,
      educationScore: resumeScores.educationScore,
      experienceScore: resumeScores.experienceScore,
      skillsScore: resumeScores.skillsScore,
      activitiesScore: resumeScores.activitiesScore,
      globalPercentile: resumeScores.globalPercentile,
      globalRank: resumeScores.globalRank,
      totalResumesRanked: resumeScores.totalResumesRanked,
      scoredAt: resumeScores.scoredAt,
      fileName: resumes.fileName,
    })
    .from(resumeScores)
    .leftJoin(resumes, eq(resumeScores.resumeId, resumes.id))
    .orderBy(desc(resumeScores.overallScore))
    .limit(limit)
    .offset(offset);
  
  return result;
}

export async function getLeaderboardStats() {
  const db = await getDb();
  if (!db) {
    return {
      total: 0,
      avgScore: 0,
      topScore: 0,
      scoreDistribution: [],
    };
  }
  
  const allScores = await db.select({
    overallScore: resumeScores.overallScore,
  }).from(resumeScores);
  
  if (allScores.length === 0) {
    return {
      total: 0,
      avgScore: 0,
      topScore: 0,
      scoreDistribution: [],
    };
  }
  
  // Calculate stats
  const scores = allScores
    .map(s => parseFloat(s.overallScore || "0"))
    .filter(s => !isNaN(s) && s > 0);
  
  const total = scores.length;
  const avgScore = scores.length > 0 
    ? scores.reduce((sum, s) => sum + s, 0) / scores.length 
    : 0;
  const topScore = scores.length > 0 ? Math.max(...scores) : 0;
  
  // Calculate distribution
  const ranges = [
    { min: 90, max: 100, label: "90-100" },
    { min: 80, max: 89, label: "80-89" },
    { min: 70, max: 79, label: "70-79" },
    { min: 60, max: 69, label: "60-69" },
    { min: 50, max: 59, label: "50-59" },
    { min: 0, max: 49, label: "0-49" },
  ];
  
  const distribution = ranges.map(range => {
    const count = scores.filter(s => s >= range.min && s <= range.max).length;
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return {
      range: range.label,
      count,
      percentage: Math.round(percentage * 10) / 10,
    };
  });
  
  return {
    total,
    avgScore: Math.round(avgScore * 10) / 10,
    topScore: Math.round(topScore * 10) / 10,
    scoreDistribution: distribution,
  };
}

export async function getTotalResumeCount() {
  const db = await getDb();
  if (!db) return 0;
  
  const result = await db.select({ count: count() }).from(resumeScores);
  return result.length > 0 && result[0] ? Number(result[0].count) : 0;
}

/**
 * Bias flags operations
 */
export async function createBiasFlag(resumeId: number, flagType: string, severity: string, description: string, flaggedContent?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(biasFlags).values({
    resumeId,
    flagType: flagType as any,
    severity: severity as any,
    description,
    flaggedContent,
  });
}

export async function getBiasFlagsByResumeId(resumeId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(biasFlags).where(eq(biasFlags.resumeId, resumeId));
}

/**
 * Recommendations operations
 */
export async function createRecommendation(resumeId: number, userId: number, type: string, title: string, description: string, priority: string = "medium", impact?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(recommendations).values({
    resumeId,
    userId,
    recommendationType: type as any,
    title,
    description,
    priority: priority as any,
    estimatedImpact: impact,
  });
}

export async function getRecommendationsByResumeId(resumeId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(recommendations).where(eq(recommendations.resumeId, resumeId)).orderBy(desc(recommendations.priority));
}

/**
 * Store parsed education data
 */
export async function createResumeEducation(resumeId: number, educationData: Array<{
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  gpa?: string;
  startDate?: string;
  endDate?: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (educationData.length === 0) return [];
  
  const values = educationData.map(edu => ({
    resumeId,
    institution: edu.institution || null,
    degree: edu.degree || null,
    fieldOfStudy: edu.fieldOfStudy || null,
    gpa: edu.gpa || null,
    startDate: edu.startDate || null,
    endDate: edu.endDate || null,
  }));
  
  return await db.insert(resumeEducation).values(values).returning();
}

/**
 * Store parsed experience data
 */
export async function createResumeExperience(resumeId: number, experienceData: Array<{
  company?: string;
  position?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  durationMonths?: number;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (experienceData.length === 0) return [];
  
  const values = experienceData.map(exp => ({
    resumeId,
    company: exp.company || null,
    position: exp.position || null,
    description: exp.description || null,
    startDate: exp.startDate || null,
    endDate: exp.endDate || null,
    durationMonths: exp.durationMonths || null,
  }));
  
  return await db.insert(resumeExperience).values(values).returning();
}

/**
 * Store parsed skills data
 */
export async function createResumeSkills(resumeId: number, skillsData: Array<{
  skillName: string;
  category?: "technical" | "soft" | "domain" | "language" | "tool" | "framework" | "other";
  proficiencyLevel?: "beginner" | "intermediate" | "advanced" | "expert";
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (skillsData.length === 0) return [];
  
  const values = skillsData.map(skill => ({
    resumeId,
    skillName: skill.skillName,
    skillCategory: (skill.category || "other") as any,
    proficiencyLevel: (skill.proficiencyLevel || "intermediate") as any,
    mentionCount: 1,
  }));
  
  return await db.insert(resumeSkills).values(values).returning();
}

/**
 * Store parsed activities data
 */
export async function createResumeActivities(resumeId: number, activitiesData: Array<{
  activityName?: string;
  activityType?: "leadership" | "volunteer" | "achievement" | "award" | "certification" | "project" | "publication" | "other";
  description?: string;
  date?: string;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (activitiesData.length === 0) return [];
  
  const values = activitiesData.map(activity => ({
    resumeId,
    activityName: activity.activityName || null,
    activityType: (activity.activityType || "other") as any,
    description: activity.description || null,
    date: activity.date || null,
  }));
  
  return await db.insert(resumeActivities).values(values).returning();
}
