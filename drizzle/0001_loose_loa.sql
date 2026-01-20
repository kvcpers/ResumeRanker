CREATE TABLE `biasFlags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resumeId` int NOT NULL,
	`flagType` enum('name_bias','age_bias','gender_bias','location_bias','disability_bias','other') NOT NULL,
	`severity` enum('low','medium','high') DEFAULT 'medium',
	`description` text,
	`flaggedContent` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `biasFlags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rankingHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resumeId` int NOT NULL,
	`userId` int NOT NULL,
	`overallScore` varchar(10),
	`globalPercentile` varchar(10),
	`globalRank` int,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rankingHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resumeId` int NOT NULL,
	`userId` int NOT NULL,
	`recommendationType` enum('skill_gap','education','experience','certification','activity','career_advice') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`priority` enum('low','medium','high') DEFAULT 'medium',
	`estimatedImpact` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resumeActivities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resumeId` int NOT NULL,
	`activityName` varchar(255),
	`activityType` enum('leadership','volunteer','achievement','award','certification','project','publication','other') DEFAULT 'other',
	`description` text,
	`date` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resumeActivities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resumeEducation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resumeId` int NOT NULL,
	`institution` varchar(255),
	`degree` varchar(255),
	`fieldOfStudy` varchar(255),
	`gpa` varchar(10),
	`startDate` varchar(20),
	`endDate` varchar(20),
	`prestigeTier` enum('tier1','tier2','tier3','tier4','tier5','unknown') DEFAULT 'unknown',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resumeEducation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resumeExperience` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resumeId` int NOT NULL,
	`company` varchar(255),
	`position` varchar(255),
	`description` text,
	`startDate` varchar(20),
	`endDate` varchar(20),
	`durationMonths` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resumeExperience_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resumeScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resumeId` int NOT NULL,
	`userId` int NOT NULL,
	`overallScore` varchar(10),
	`educationScore` varchar(10),
	`experienceScore` varchar(10),
	`skillsScore` varchar(10),
	`activitiesScore` varchar(10),
	`globalPercentile` varchar(10),
	`globalRank` int,
	`totalResumesRanked` int,
	`scoredAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resumeScores_id` PRIMARY KEY(`id`),
	CONSTRAINT `resumeScores_resumeId_unique` UNIQUE(`resumeId`)
);
--> statement-breakpoint
CREATE TABLE `resumeSkills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resumeId` int NOT NULL,
	`skillName` varchar(255) NOT NULL,
	`skillCategory` enum('technical','soft','domain','language','tool','framework','other') DEFAULT 'other',
	`proficiencyLevel` enum('beginner','intermediate','advanced','expert') DEFAULT 'intermediate',
	`mentionCount` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resumeSkills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resumes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` text NOT NULL,
	`rawText` text,
	`parsingStatus` enum('pending','parsing','completed','failed') NOT NULL DEFAULT 'pending',
	`parsingError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resumes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `biasFlags` ADD CONSTRAINT `biasFlags_resumeId_resumes_id_fk` FOREIGN KEY (`resumeId`) REFERENCES `resumes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rankingHistory` ADD CONSTRAINT `rankingHistory_resumeId_resumes_id_fk` FOREIGN KEY (`resumeId`) REFERENCES `resumes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rankingHistory` ADD CONSTRAINT `rankingHistory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recommendations` ADD CONSTRAINT `recommendations_resumeId_resumes_id_fk` FOREIGN KEY (`resumeId`) REFERENCES `resumes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `recommendations` ADD CONSTRAINT `recommendations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resumeActivities` ADD CONSTRAINT `resumeActivities_resumeId_resumes_id_fk` FOREIGN KEY (`resumeId`) REFERENCES `resumes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resumeEducation` ADD CONSTRAINT `resumeEducation_resumeId_resumes_id_fk` FOREIGN KEY (`resumeId`) REFERENCES `resumes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resumeExperience` ADD CONSTRAINT `resumeExperience_resumeId_resumes_id_fk` FOREIGN KEY (`resumeId`) REFERENCES `resumes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resumeScores` ADD CONSTRAINT `resumeScores_resumeId_resumes_id_fk` FOREIGN KEY (`resumeId`) REFERENCES `resumes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resumeScores` ADD CONSTRAINT `resumeScores_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resumeSkills` ADD CONSTRAINT `resumeSkills_resumeId_resumes_id_fk` FOREIGN KEY (`resumeId`) REFERENCES `resumes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resumes` ADD CONSTRAINT `resumes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;