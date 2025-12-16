ALTER TABLE `clubs` ADD `emailProvider` enum('none','smtp','sendgrid','mailgun') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `clubs` ADD `smtpHost` varchar(255);--> statement-breakpoint
ALTER TABLE `clubs` ADD `smtpPort` int DEFAULT 587;--> statement-breakpoint
ALTER TABLE `clubs` ADD `smtpSecure` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `clubs` ADD `smtpUser` varchar(255);--> statement-breakpoint
ALTER TABLE `clubs` ADD `smtpPassword` varchar(255);--> statement-breakpoint
ALTER TABLE `clubs` ADD `emailFromName` varchar(255);--> statement-breakpoint
ALTER TABLE `clubs` ADD `emailFromAddress` varchar(320);--> statement-breakpoint
ALTER TABLE `clubs` ADD `emailEnabled` boolean DEFAULT false NOT NULL;