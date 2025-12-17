CREATE TABLE `parentChildren` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parentUserId` int NOT NULL,
	`playerId` int NOT NULL,
	`relationship` enum('parent','guardian','other') NOT NULL DEFAULT 'parent',
	`isVerified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parentChildren_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playerRatings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`playerId` int NOT NULL,
	`coachId` int NOT NULL,
	`eventType` enum('training','match') NOT NULL,
	`eventId` int NOT NULL,
	`eventDate` date NOT NULL,
	`technique` int NOT NULL,
	`engagement` int NOT NULL,
	`progress` int NOT NULL,
	`teamwork` int NOT NULL,
	`overall` decimal(3,2) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playerRatings_id` PRIMARY KEY(`id`)
);
