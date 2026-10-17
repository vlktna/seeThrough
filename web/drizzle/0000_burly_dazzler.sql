CREATE TABLE `devices` (
	`session_id` text NOT NULL,
	`device_id` text NOT NULL,
	`name` text NOT NULL,
	`source` text NOT NULL,
	`room_number` integer,
	`room_at` integer DEFAULT 0 NOT NULL,
	`position` text,
	`position_at` integer DEFAULT 0 NOT NULL,
	`imu` text,
	`imu_at` integer DEFAULT 0 NOT NULL,
	`last_seen` integer NOT NULL,
	PRIMARY KEY(`session_id`, `device_id`),
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `samples` (
	`seq` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` text NOT NULL,
	`device_id` text NOT NULL,
	`sample_id` text NOT NULL,
	`timestamp` integer NOT NULL,
	`payload` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `samples_dedup` ON `samples` (`session_id`,`device_id`,`sample_id`);--> statement-breakpoint
CREATE INDEX `samples_session_seq` ON `samples` (`session_id`,`seq`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`read_hash` text NOT NULL,
	`write_hash` text NOT NULL,
	`creator_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sessions_creator_time` ON `sessions` (`creator_hash`,`created_at`);