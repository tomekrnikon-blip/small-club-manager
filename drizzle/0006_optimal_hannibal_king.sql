CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`userEmail` varchar(320),
	`action` varchar(100) NOT NULL,
	`category` enum('auth','club','member','finance','config','admin','subscription') NOT NULL DEFAULT 'admin',
	`targetType` varchar(50),
	`targetId` int,
	`details` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`status` enum('success','failure','warning') NOT NULL DEFAULT 'success',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rateLimits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`endpoint` varchar(100) NOT NULL,
	`count` int NOT NULL DEFAULT 0,
	`windowStart` timestamp NOT NULL DEFAULT (now()),
	`windowEnd` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rateLimits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `twoFactorAuth` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`secret` varchar(255) NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT false,
	`backupCodes` text,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `twoFactorAuth_id` PRIMARY KEY(`id`),
	CONSTRAINT `twoFactorAuth_userId_unique` UNIQUE(`userId`)
);
