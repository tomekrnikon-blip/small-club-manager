ALTER TABLE `clubs` ADD `trialStartDate` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `clubs` ADD `trialEndDate` timestamp;--> statement-breakpoint
ALTER TABLE `clubs` ADD `isTrialActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `clubs` ADD `trialExpiredNotified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `clubs` ADD `subscriptionRequired` boolean DEFAULT false NOT NULL;