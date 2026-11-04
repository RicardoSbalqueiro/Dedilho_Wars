CREATE TABLE `match_awards` (
	`match_id` text NOT NULL,
	`user_id` text NOT NULL,
	`won` integer NOT NULL,
	`xp` integer NOT NULL,
	`points` integer NOT NULL,
	`finisher` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`match_id`, `user_id`),
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`room_code` text NOT NULL,
	`host_id` text NOT NULL,
	`guest_id` text NOT NULL,
	`host_char` text NOT NULL,
	`guest_char` text NOT NULL,
	`stage` text NOT NULL,
	`created` integer NOT NULL,
	`finished` integer,
	`host_score` integer DEFAULT 0 NOT NULL,
	`guest_score` integer DEFAULT 0 NOT NULL,
	`winner_idx` integer,
	`finisher_idx` integer DEFAULT -1 NOT NULL,
	`host_report` text,
	`guest_report` text,
	`status` text DEFAULT 'pending' NOT NULL,
	FOREIGN KEY (`host_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`guest_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `matches_host` ON `matches` (`host_id`,`created`);--> statement-breakpoint
CREATE INDEX `matches_guest` ON `matches` (`guest_id`,`created`);--> statement-breakpoint
ALTER TABLE `users` ADD `games` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `wins` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `losses` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `xp` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `points` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `finishers` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `streak` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `best_streak` integer DEFAULT 0 NOT NULL;
