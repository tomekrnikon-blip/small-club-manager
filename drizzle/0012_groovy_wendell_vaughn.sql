CREATE TABLE `announcementReads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`announcementId` int NOT NULL,
	`userId` int NOT NULL,
	`readAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `announcementReads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`authorId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`priority` enum('normal','important','urgent') NOT NULL DEFAULT 'normal',
	`pinned` boolean NOT NULL DEFAULT false,
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seasonalAwards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`playerId` int NOT NULL,
	`season` varchar(20) NOT NULL,
	`awardType` enum('mvp','top_scorer','best_attendance','most_improved','best_defender','best_goalkeeper','fair_play') NOT NULL,
	`title` varchar(100) NOT NULL,
	`description` text,
	`stats` text,
	`awardedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `seasonalAwards_id` PRIMARY KEY(`id`)
);
