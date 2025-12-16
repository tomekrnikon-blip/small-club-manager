CREATE TABLE `scheduledNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`type` enum('callup_48h','callup_24h','payment_reminder','training_reminder','custom') NOT NULL,
	`referenceId` int,
	`referenceType` enum('match','training','payment','academy'),
	`scheduledFor` timestamp NOT NULL,
	`status` enum('pending','sent','failed','cancelled') NOT NULL DEFAULT 'pending',
	`channel` enum('app','email','sms','both') NOT NULL DEFAULT 'app',
	`recipientIds` text,
	`title` varchar(255) NOT NULL,
	`message` text,
	`sentAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduledNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `matchCallups` ADD `notified48h` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `matchCallups` ADD `notified24h` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `matchCallups` ADD `responseNote` text;--> statement-breakpoint
ALTER TABLE `matchCallups` ADD `notificationChannel` enum('app','email','sms','both') DEFAULT 'app' NOT NULL;--> statement-breakpoint
ALTER TABLE `matchCallups` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;