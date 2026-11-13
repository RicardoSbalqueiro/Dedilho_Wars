CREATE TABLE `training_awards` (
	`user_id` text NOT NULL,
	`reward_key` text NOT NULL,
	`run_id` text NOT NULL,
	`activity_id` text NOT NULL,
	`xp` integer NOT NULL,
	`reason` text NOT NULL,
	`utc_day` text NOT NULL,
	`applied` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `reward_key`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `training_awards_daily` ON `training_awards` (`user_id`,`utc_day`,`reason`);--> statement-breakpoint
CREATE TABLE `training_progress` (
	`user_id` text PRIMARY KEY NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`last_run_id` text,
	`data` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `training_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`activity_id` text NOT NULL,
	`character` text NOT NULL,
	`seed` integer NOT NULL,
	`version` text NOT NULL,
	`config` text NOT NULL,
	`state` text DEFAULT 'active' NOT NULL,
	`claim_id` text,
	`created` integer NOT NULL,
	`expires` integer NOT NULL,
	`result` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `training_runs_user` ON `training_runs` (`user_id`,`created`);--> statement-breakpoint
CREATE UNIQUE INDEX `training_one_active` ON `training_runs` (`user_id`) WHERE "training_runs"."state"='active';--> statement-breakpoint
ALTER TABLE `users` ADD `training_xp` integer DEFAULT 0 NOT NULL;