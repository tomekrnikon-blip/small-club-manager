CREATE TABLE `appSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text,
	`description` varchar(255),
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `appSettings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `userSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`stripeSubscriptionId` varchar(255),
	`stripeCustomerId` varchar(255),
	`status` enum('active','cancelled','past_due','trialing','expired','manual') NOT NULL DEFAULT 'active',
	`billingPeriod` enum('monthly','yearly') NOT NULL DEFAULT 'monthly',
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelledAt` timestamp,
	`grantedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userSubscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `clubs` ADD `twilioAccountSid` varchar(255);--> statement-breakpoint
ALTER TABLE `clubs` ADD `twilioAuthToken` varchar(255);--> statement-breakpoint
ALTER TABLE `clubs` ADD `twilioPhoneNumber` varchar(20);--> statement-breakpoint
ALTER TABLE `clubs` ADD `smsapiToken` varchar(255);