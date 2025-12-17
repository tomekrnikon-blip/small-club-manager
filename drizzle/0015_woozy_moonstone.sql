CREATE TABLE `clubPzpnLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`pzpnTeamId` int NOT NULL,
	`verified` boolean NOT NULL DEFAULT false,
	`verifiedAt` timestamp,
	`verifiedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clubPzpnLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pzpnLeagues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`regionId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`level` int NOT NULL,
	`season` varchar(20) NOT NULL,
	`groupName` varchar(50),
	`externalId` varchar(100),
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pzpnLeagues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pzpnRegions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(100) NOT NULL,
	`website` varchar(255),
	`scrapingEnabled` boolean NOT NULL DEFAULT false,
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pzpnRegions_id` PRIMARY KEY(`id`),
	CONSTRAINT `pzpnRegions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `pzpnTeams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leagueId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`externalId` varchar(100),
	`position` int,
	`matches` int DEFAULT 0,
	`points` int DEFAULT 0,
	`wins` int DEFAULT 0,
	`draws` int DEFAULT 0,
	`losses` int DEFAULT 0,
	`goalsFor` int DEFAULT 0,
	`goalsAgainst` int DEFAULT 0,
	`goalDifference` int DEFAULT 0,
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pzpnTeams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `socialMediaConnections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`platform` enum('facebook','instagram') NOT NULL,
	`accessToken` text NOT NULL,
	`pageId` varchar(100),
	`accountId` varchar(100),
	`pageName` varchar(255),
	`username` varchar(100),
	`expiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `socialMediaConnections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `socialMediaPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`connectionId` int NOT NULL,
	`contentType` enum('match_preview','match_result','match_stats','player_highlight','custom') NOT NULL,
	`referenceType` enum('match','player','training','custom'),
	`referenceId` int,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`imageUrl` varchar(500),
	`hashtags` varchar(500),
	`status` enum('draft','scheduled','published','failed') NOT NULL DEFAULT 'draft',
	`scheduledFor` timestamp,
	`publishedAt` timestamp,
	`externalPostId` varchar(100),
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `socialMediaPosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `type` enum('match','training','payment','callup','general','achievement') NOT NULL;