import { pgTable, pgEnum, serial, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";

// Enums
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const parsingStatusEnum = pgEnum("parsingStatus", ["pending", "parsing", "completed", "failed"]);
export const prestigeTierEnum = pgEnum("prestigeTier", ["tier1", "tier2", "tier3", "tier4", "tier5", "unknown"]);
export const skillCategoryEnum = pgEnum("skillCategory", ["technical", "soft", "domain", "language", "tool", "framework", "other"]);
export const proficiencyLevelEnum = pgEnum("proficiencyLevel", ["beginner", "intermediate", "advanced", "expert"]);
export const activityTypeEnum = pgEnum("activityType", ["leadership", "volunteer", "achievement", "award", "certification", "project", "publication", "other"]);
export const flagTypeEnum = pgEnum("flagType", ["name_bias", "age_bias", "gender_bias", "location_bias", "disability_bias", "other"]);
export const severityEnum = pgEnum("severity", ["low", "medium", "high"]);
export const recommendationTypeEnum = pgEnum("recommendationType", ["skill_gap", "education", "experience", "certification", "activity", "career_advice"]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: serial("id").primaryKey(),
  /** User identifier (openId). Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * User sessions for authentication
 */
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Resume metadata and parsed content
 */
export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  rawText: text("rawText"),
  parsingStatus: parsingStatusEnum("parsingStatus").default("pending").notNull(),
  parsingError: text("parsingError"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type Resume = typeof resumes.$inferSelect;
export type InsertResume = typeof resumes.$inferInsert;

/**
 * Parsed resume data - education information
 */
export const resumeEducation = pgTable("resumeEducation", {
  id: serial("id").primaryKey(),
  resumeId: integer("resumeId").notNull().references(() => resumes.id),
  institution: varchar("institution", { length: 255 }),
  degree: varchar("degree", { length: 255 }),
  fieldOfStudy: varchar("fieldOfStudy", { length: 255 }),
  gpa: varchar("gpa", { length: 10 }),
  startDate: varchar("startDate", { length: 20 }),
  endDate: varchar("endDate", { length: 20 }),
  prestigeTier: prestigeTierEnum("prestigeTier").default("unknown"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type ResumeEducation = typeof resumeEducation.$inferSelect;
export type InsertResumeEducation = typeof resumeEducation.$inferInsert;

/**
 * Parsed resume data - work experience
 */
export const resumeExperience = pgTable("resumeExperience", {
  id: serial("id").primaryKey(),
  resumeId: integer("resumeId").notNull().references(() => resumes.id),
  company: varchar("company", { length: 255 }),
  position: varchar("position", { length: 255 }),
  description: text("description"),
  startDate: varchar("startDate", { length: 20 }),
  endDate: varchar("endDate", { length: 20 }),
  durationMonths: integer("durationMonths"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type ResumeExperience = typeof resumeExperience.$inferSelect;
export type InsertResumeExperience = typeof resumeExperience.$inferInsert;

/**
 * Extracted skills from resume
 */
export const resumeSkills = pgTable("resumeSkills", {
  id: serial("id").primaryKey(),
  resumeId: integer("resumeId").notNull().references(() => resumes.id),
  skillName: varchar("skillName", { length: 255 }).notNull(),
  skillCategory: skillCategoryEnum("skillCategory").default("other"),
  proficiencyLevel: proficiencyLevelEnum("proficiencyLevel").default("intermediate"),
  mentionCount: integer("mentionCount").default(1),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type ResumeSkill = typeof resumeSkills.$inferSelect;
export type InsertResumeSkill = typeof resumeSkills.$inferInsert;

/**
 * Extracurricular activities and achievements
 */
export const resumeActivities = pgTable("resumeActivities", {
  id: serial("id").primaryKey(),
  resumeId: integer("resumeId").notNull().references(() => resumes.id),
  activityName: varchar("activityName", { length: 255 }),
  activityType: activityTypeEnum("activityType").default("other"),
  description: text("description"),
  date: varchar("date", { length: 20 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type ResumeActivity = typeof resumeActivities.$inferSelect;
export type InsertResumeActivity = typeof resumeActivities.$inferInsert;

/**
 * Resume scores and ranking data
 */
export const resumeScores = pgTable("resumeScores", {
  id: serial("id").primaryKey(),
  resumeId: integer("resumeId").notNull().references(() => resumes.id).unique(),
  userId: integer("userId").notNull().references(() => users.id),
  overallScore: varchar("overallScore", { length: 10 }),
  educationScore: varchar("educationScore", { length: 10 }),
  experienceScore: varchar("experienceScore", { length: 10 }),
  skillsScore: varchar("skillsScore", { length: 10 }),
  activitiesScore: varchar("activitiesScore", { length: 10 }),
  globalPercentile: varchar("globalPercentile", { length: 10 }),
  globalRank: integer("globalRank"),
  totalResumesRanked: integer("totalResumesRanked"),
  scoredAt: timestamp("scoredAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type ResumeScore = typeof resumeScores.$inferSelect;
export type InsertResumeScore = typeof resumeScores.$inferInsert;

/**
 * Bias detection flags
 */
export const biasFlags = pgTable("biasFlags", {
  id: serial("id").primaryKey(),
  resumeId: integer("resumeId").notNull().references(() => resumes.id),
  flagType: flagTypeEnum("flagType").notNull(),
  severity: severityEnum("severity").default("medium"),
  description: text("description"),
  flaggedContent: varchar("flaggedContent", { length: 512 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type BiasFlag = typeof biasFlags.$inferSelect;
export type InsertBiasFlag = typeof biasFlags.$inferInsert;

/**
 * Ranking history for analytics
 */
export const rankingHistory = pgTable("rankingHistory", {
  id: serial("id").primaryKey(),
  resumeId: integer("resumeId").notNull().references(() => resumes.id),
  userId: integer("userId").notNull().references(() => users.id),
  overallScore: varchar("overallScore", { length: 10 }),
  globalPercentile: varchar("globalPercentile", { length: 10 }),
  globalRank: integer("globalRank"),
  recordedAt: timestamp("recordedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type RankingHistory = typeof rankingHistory.$inferSelect;
export type InsertRankingHistory = typeof rankingHistory.$inferInsert;

/**
 * Improvement recommendations
 */
export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  resumeId: integer("resumeId").notNull().references(() => resumes.id),
  userId: integer("userId").notNull().references(() => users.id),
  recommendationType: recommendationTypeEnum("recommendationType").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  priority: priorityEnum("priority").default("medium"),
  estimatedImpact: varchar("estimatedImpact", { length: 10 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = typeof recommendations.$inferInsert;
