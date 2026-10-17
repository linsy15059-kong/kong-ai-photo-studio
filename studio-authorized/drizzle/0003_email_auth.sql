CREATE TABLE `email_auth_codes` (
  `email` text PRIMARY KEY NOT NULL,
  `code_hash` text NOT NULL,
  `expires_at` integer NOT NULL,
  `attempts` integer DEFAULT 0 NOT NULL,
  `requested_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `auth_sessions` (
  `token_hash` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  `created_at` text NOT NULL,
  `expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `auth_sessions_email_idx` ON `auth_sessions` (`email`);
