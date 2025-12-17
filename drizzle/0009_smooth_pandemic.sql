CREATE TABLE `changeHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`userId` int NOT NULL,
	`entityType` enum('training','match','player','team','finance') NOT NULL,
	`entityId` int NOT NULL,
	`action` enum('create','update','delete') NOT NULL,
	`fieldName` varchar(100),
	`oldValue` text,
	`newValue` text,
	`description` text,
	`canRevert` boolean NOT NULL DEFAULT true,
	`revertedAt` timestamp,
	`revertedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `changeHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surveyOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyId` int NOT NULL,
	`optionText` varchar(255) NOT NULL,
	`optionDate` timestamp,
	`voteCount` int NOT NULL DEFAULT 0,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `surveyOptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surveyVotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`surveyId` int NOT NULL,
	`optionId` int NOT NULL,
	`userId` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `surveyVotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surveys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`createdBy` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`surveyType` enum('poll','feedback','date_vote') NOT NULL DEFAULT 'poll',
	`status` enum('active','closed','draft') NOT NULL DEFAULT 'active',
	`allowMultiple` boolean NOT NULL DEFAULT false,
	`isAnonymous` boolean NOT NULL DEFAULT false,
	`endsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `surveys_id` PRIMARY KEY(`id`)
);
