CREATE TABLE `trainingGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerId` int NOT NULL,
	`clubId` int NOT NULL,
	`goalType` enum('goals','assists','attendance','rating','custom') NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`targetValue` int NOT NULL,
	`currentValue` int NOT NULL DEFAULT 0,
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`endDate` timestamp,
	`status` enum('active','completed','failed','cancelled') NOT NULL DEFAULT 'active',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trainingGoals_id` PRIMARY KEY(`id`)
);
