CREATE TABLE `commercial_licenses` (
	`email` text PRIMARY KEY NOT NULL,
	`code_hash` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`version` text DEFAULT '1' NOT NULL,
	`created_at` text NOT NULL,
	`activated_at` text,
	`note` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `commercial_licenses_code_hash_unique` ON `commercial_licenses` (`code_hash`);--> statement-breakpoint
CREATE TABLE `desktop_devices` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`device_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `desktop_devices_email_idx` ON `desktop_devices` (`email`);--> statement-breakpoint
CREATE TABLE `desktop_pairs` (
	`id` text PRIMARY KEY NOT NULL,
	`secret_hash` text NOT NULL,
	`device_id` text NOT NULL,
	`name` text NOT NULL,
	`expires_at` integer NOT NULL,
	`email` text
);
--> statement-breakpoint
CREATE TABLE `desktop_rate` (
	`bucket` text PRIMARY KEY NOT NULL,
	`calls` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `desktop_slots` (
	`email` text NOT NULL,
	`slot` integer NOT NULL,
	`device_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	PRIMARY KEY(`email`, `slot`)
);
