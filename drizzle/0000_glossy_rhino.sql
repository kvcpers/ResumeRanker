CREATE TYPE "public"."activityType" AS ENUM('leadership', 'volunteer', 'achievement', 'award', 'certification', 'project', 'publication', 'other');--> statement-breakpoint
CREATE TYPE "public"."flagType" AS ENUM('name_bias', 'age_bias', 'gender_bias', 'location_bias', 'disability_bias', 'other');--> statement-breakpoint
CREATE TYPE "public"."parsingStatus" AS ENUM('pending', 'parsing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."prestigeTier" AS ENUM('tier1', 'tier2', 'tier3', 'tier4', 'tier5', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."proficiencyLevel" AS ENUM('beginner', 'intermediate', 'advanced', 'expert');--> statement-breakpoint
CREATE TYPE "public"."recommendationType" AS ENUM('skill_gap', 'education', 'experience', 'certification', 'activity', 'career_advice');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."skillCategory" AS ENUM('technical', 'soft', 'domain', 'language', 'tool', 'framework', 'other');--> statement-breakpoint
CREATE TABLE "biasFlags" (
	"id" serial PRIMARY KEY NOT NULL,
	"resumeId" integer NOT NULL,
	"flagType" "flagType" NOT NULL,
	"severity" "severity" DEFAULT 'medium',
	"description" text,
	"flaggedContent" varchar(512),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rankingHistory" (
	"id" serial PRIMARY KEY NOT NULL,
	"resumeId" integer NOT NULL,
	"userId" integer NOT NULL,
	"overallScore" varchar(10),
	"globalPercentile" varchar(10),
	"globalRank" integer,
	"recordedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"resumeId" integer NOT NULL,
	"userId" integer NOT NULL,
	"recommendationType" "recommendationType" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"priority" "priority" DEFAULT 'medium',
	"estimatedImpact" varchar(10),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resumeActivities" (
	"id" serial PRIMARY KEY NOT NULL,
	"resumeId" integer NOT NULL,
	"activityName" varchar(255),
	"activityType" "activityType" DEFAULT 'other',
	"description" text,
	"date" varchar(20),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resumeEducation" (
	"id" serial PRIMARY KEY NOT NULL,
	"resumeId" integer NOT NULL,
	"institution" varchar(255),
	"degree" varchar(255),
	"fieldOfStudy" varchar(255),
	"gpa" varchar(10),
	"startDate" varchar(20),
	"endDate" varchar(20),
	"prestigeTier" "prestigeTier" DEFAULT 'unknown',
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resumeExperience" (
	"id" serial PRIMARY KEY NOT NULL,
	"resumeId" integer NOT NULL,
	"company" varchar(255),
	"position" varchar(255),
	"description" text,
	"startDate" varchar(20),
	"endDate" varchar(20),
	"durationMonths" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resumeScores" (
	"id" serial PRIMARY KEY NOT NULL,
	"resumeId" integer NOT NULL,
	"userId" integer NOT NULL,
	"overallScore" varchar(10),
	"educationScore" varchar(10),
	"experienceScore" varchar(10),
	"skillsScore" varchar(10),
	"activitiesScore" varchar(10),
	"globalPercentile" varchar(10),
	"globalRank" integer,
	"totalResumesRanked" integer,
	"scoredAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resumeScores_resumeId_unique" UNIQUE("resumeId")
);
--> statement-breakpoint
CREATE TABLE "resumeSkills" (
	"id" serial PRIMARY KEY NOT NULL,
	"resumeId" integer NOT NULL,
	"skillName" varchar(255) NOT NULL,
	"skillCategory" "skillCategory" DEFAULT 'other',
	"proficiencyLevel" "proficiencyLevel" DEFAULT 'intermediate',
	"mentionCount" integer DEFAULT 1,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resumes" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"fileName" varchar(255) NOT NULL,
	"fileKey" varchar(512) NOT NULL,
	"fileUrl" text NOT NULL,
	"rawText" text,
	"parsingStatus" "parsingStatus" DEFAULT 'pending' NOT NULL,
	"parsingError" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"token" varchar(255) NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320) NOT NULL,
	"passwordHash" varchar(255) NOT NULL,
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "biasFlags" ADD CONSTRAINT "biasFlags_resumeId_resumes_id_fk" FOREIGN KEY ("resumeId") REFERENCES "public"."resumes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rankingHistory" ADD CONSTRAINT "rankingHistory_resumeId_resumes_id_fk" FOREIGN KEY ("resumeId") REFERENCES "public"."resumes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rankingHistory" ADD CONSTRAINT "rankingHistory_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_resumeId_resumes_id_fk" FOREIGN KEY ("resumeId") REFERENCES "public"."resumes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumeActivities" ADD CONSTRAINT "resumeActivities_resumeId_resumes_id_fk" FOREIGN KEY ("resumeId") REFERENCES "public"."resumes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumeEducation" ADD CONSTRAINT "resumeEducation_resumeId_resumes_id_fk" FOREIGN KEY ("resumeId") REFERENCES "public"."resumes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumeExperience" ADD CONSTRAINT "resumeExperience_resumeId_resumes_id_fk" FOREIGN KEY ("resumeId") REFERENCES "public"."resumes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumeScores" ADD CONSTRAINT "resumeScores_resumeId_resumes_id_fk" FOREIGN KEY ("resumeId") REFERENCES "public"."resumes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumeScores" ADD CONSTRAINT "resumeScores_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumeSkills" ADD CONSTRAINT "resumeSkills_resumeId_resumes_id_fk" FOREIGN KEY ("resumeId") REFERENCES "public"."resumes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;