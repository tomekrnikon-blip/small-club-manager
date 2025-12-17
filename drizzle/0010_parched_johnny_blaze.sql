CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`category` enum('goals','assists','attendance','ratings','matches','special') NOT NULL,
	`icon` varchar(50) NOT NULL,
	`color` varchar(20) NOT NULL,
	`threshold` int NOT NULL,
	`points` int NOT NULL DEFAULT 10,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`),
	CONSTRAINT `achievements_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `playerAchievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`achievementId` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	`currentValue` int NOT NULL DEFAULT 0,
	`notified` boolean NOT NULL DEFAULT false,
	CONSTRAINT `playerAchievements_id` PRIMARY KEY(`id`)
);
