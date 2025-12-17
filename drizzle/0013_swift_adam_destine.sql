CREATE TABLE `photoAlbums` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`eventType` enum('training','match','tournament','event','other') NOT NULL DEFAULT 'other',
	`eventId` int,
	`eventDate` timestamp,
	`coverPhotoId` int,
	`photoCount` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `photoAlbums_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `photoTags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`photoId` int NOT NULL,
	`playerId` int NOT NULL,
	`positionX` int,
	`positionY` int,
	`taggedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `photoTags_id` PRIMARY KEY(`id`)
);
