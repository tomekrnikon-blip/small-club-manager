CREATE TABLE `academyPayments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`amount` int NOT NULL,
	`paymentDate` date NOT NULL,
	`paymentMonth` varchar(20),
	`paymentMethod` varchar(50),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `academyPayments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `academyStudents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`dateOfBirth` date,
	`parentName` varchar(255),
	`parentPhone` varchar(20),
	`parentEmail` varchar(320),
	`groupName` varchar(100),
	`monthlyFee` int DEFAULT 0,
	`lastReminderSent` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `academyStudents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clubMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('manager','board_member','board_member_finance','coach','player') NOT NULL DEFAULT 'player',
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clubMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clubs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`location` varchar(255),
	`city` varchar(255),
	`foundedYear` int,
	`description` text,
	`logoUrl` text,
	`reminderEmailSubject` varchar(255) DEFAULT 'Przypomnienie o opłacie składki',
	`reminderEmailBody` text,
	`reminderEmailSignature` varchar(255),
	`smsProvider` enum('none','smsapi','twilio','smslabs') NOT NULL DEFAULT 'none',
	`smsApiKey` varchar(255),
	`smsSenderName` varchar(11),
	`smsEnabled` boolean NOT NULL DEFAULT false,
	`smsMonthlyLimit` int DEFAULT 500,
	`reminderHoursBefore` int DEFAULT 24,
	`reminderEnabled` boolean NOT NULL DEFAULT true,
	`isBlocked` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clubs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financeCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `financeCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`category` varchar(100) NOT NULL,
	`amount` int NOT NULL,
	`transactionDate` date NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `finances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `injuries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`injuryType` varchar(255) NOT NULL,
	`injuryDate` date NOT NULL,
	`expectedRecoveryDate` date,
	`actualRecoveryDate` date,
	`status` enum('active','recovering','recovered') NOT NULL DEFAULT 'active',
	`severity` enum('minor','moderate','severe') NOT NULL DEFAULT 'moderate',
	`notes` text,
	`treatment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `injuries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matchCallups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`playerId` int NOT NULL,
	`status` enum('pending','confirmed','declined') NOT NULL DEFAULT 'pending',
	`notifiedAt` timestamp,
	`respondedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `matchCallups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matchStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`playerId` int NOT NULL,
	`teamId` int,
	`minutesPlayed` int NOT NULL DEFAULT 0,
	`goals` int NOT NULL DEFAULT 0,
	`assists` int NOT NULL DEFAULT 0,
	`yellowCards` int NOT NULL DEFAULT 0,
	`redCards` int NOT NULL DEFAULT 0,
	`saves` int NOT NULL DEFAULT 0,
	`goalsConceded` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `matchStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`teamId` int,
	`season` varchar(20) NOT NULL DEFAULT '2024/2025',
	`opponent` varchar(255) NOT NULL,
	`matchDate` date NOT NULL,
	`matchTime` varchar(10),
	`location` varchar(255),
	`homeAway` enum('home','away') NOT NULL,
	`goalsScored` int NOT NULL DEFAULT 0,
	`goalsConceded` int NOT NULL DEFAULT 0,
	`result` enum('win','draw','loss'),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`userId` int,
	`type` enum('match','training','payment','callup','general') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`sentVia` enum('app','email','sms') NOT NULL DEFAULT 'app',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`albumId` int,
	`url` text NOT NULL,
	`title` varchar(255),
	`description` text,
	`uploadDate` timestamp NOT NULL DEFAULT (now()),
	`tags` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playerStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`season` varchar(20) NOT NULL,
	`matchesPlayed` int NOT NULL DEFAULT 0,
	`minutesPlayed` int NOT NULL DEFAULT 0,
	`goals` int NOT NULL DEFAULT 0,
	`assists` int NOT NULL DEFAULT 0,
	`yellowCards` int NOT NULL DEFAULT 0,
	`redCards` int NOT NULL DEFAULT 0,
	`saves` int NOT NULL DEFAULT 0,
	`goalsConceded` int NOT NULL DEFAULT 0,
	`cleanSheets` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playerStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`teamId` int,
	`name` varchar(255) NOT NULL,
	`position` enum('bramkarz','obrońca','pomocnik','napastnik') NOT NULL,
	`jerseyNumber` int,
	`dateOfBirth` date,
	`photoUrl` text,
	`phone` varchar(20),
	`email` varchar(320),
	`isAcademy` boolean NOT NULL DEFAULT false,
	`parentName` varchar(255),
	`parentPhone` varchar(20),
	`parentEmail` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptionPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`displayName` varchar(100) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`yearlyPrice` decimal(10,2),
	`stripePriceIdMonthly` varchar(255),
	`stripePriceIdYearly` varchar(255),
	`features` text,
	`maxPlayers` int DEFAULT 50,
	`maxTeams` int DEFAULT 3,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptionPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`ageGroup` varchar(50),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trainingAttendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trainingId` int NOT NULL,
	`playerId` int NOT NULL,
	`attended` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trainingAttendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trainings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`teamId` int,
	`trainingDate` date NOT NULL,
	`trainingTime` varchar(10),
	`location` varchar(255),
	`duration` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trainings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','trener','zawodnik','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `isMasterAdmin` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `isPro` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `proGrantedBy` int;--> statement-breakpoint
ALTER TABLE `users` ADD `proGrantedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionStatus` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionPlanId` int;