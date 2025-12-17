CREATE TABLE `matchEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`matchId` int NOT NULL,
	`playerId` int,
	`assistPlayerId` int,
	`eventType` enum('goal','assist','yellow_card','red_card','substitution_in','substitution_out','save','injury') NOT NULL,
	`minute` int NOT NULL,
	`half` enum('first','second','extra_first','extra_second','penalties') NOT NULL DEFAULT 'first',
	`description` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `matchEvents_id` PRIMARY KEY(`id`)
);
