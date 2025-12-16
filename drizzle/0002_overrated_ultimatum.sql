CREATE TABLE `clubInvitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('manager','board_member','board_member_finance','coach','player') NOT NULL DEFAULT 'player',
	`token` varchar(64) NOT NULL,
	`invitedBy` int NOT NULL,
	`status` enum('pending','accepted','revoked','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`acceptedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clubInvitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `clubInvitations_token_unique` UNIQUE(`token`)
);
