CREATE TABLE `activity` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`last_seen` text NOT NULL,
	`page` text DEFAULT 'workbench' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `activity_email_idx` ON `activity` (`email`);--> statement-breakpoint
CREATE INDEX `activity_seen_idx` ON `activity` (`last_seen`);--> statement-breakpoint
CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_email` text NOT NULL,
	`action` text NOT NULL,
	`target_email` text NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_time_idx` ON `audit` (`created_at`);--> statement-breakpoint
CREATE TABLE `daily_usage` (
	`email` text NOT NULL,
	`day` text NOT NULL,
	`calls` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`email`, `day`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`email` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`daily_limit` integer DEFAULT 30 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`granted_by` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`tool` text NOT NULL,
	`preset` text NOT NULL,
	`status` text DEFAULT 'running' NOT NULL,
	`created_at` text NOT NULL,
	`finished_at` text,
	`duration_ms` integer,
	`error_code` text DEFAULT '' NOT NULL,
	`error_message` text DEFAULT '' NOT NULL,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`quality` text DEFAULT 'high' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tasks_email_time_idx` ON `tasks` (`email`,`created_at`);--> statement-breakpoint
CREATE INDEX `tasks_time_idx` ON `tasks` (`created_at`);--> statement-breakpoint
CREATE INDEX `tasks_status_idx` ON `tasks` (`status`);