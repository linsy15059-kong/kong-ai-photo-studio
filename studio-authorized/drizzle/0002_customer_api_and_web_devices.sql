CREATE TABLE `customer_api_keys` (
  `email` text PRIMARY KEY NOT NULL,
  `encrypted_key` text NOT NULL,
  `model` text DEFAULT 'gpt-image-2' NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `web_devices` (
  `email` text NOT NULL,
  `device_id` text NOT NULL,
  `name` text DEFAULT '浏览器设备' NOT NULL,
  `created_at` text NOT NULL,
  `last_seen` integer NOT NULL,
  PRIMARY KEY(`email`, `device_id`)
);
--> statement-breakpoint
CREATE INDEX `web_devices_email_idx` ON `web_devices` (`email`);
