CREATE TABLE `business_differences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`value` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `business_differences_user_id_idx` ON `business_differences` (`user_id`);--> statement-breakpoint
CREATE TABLE `business_intro` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`user_name` text,
	`business_description` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `business_intro_user_id_idx` ON `business_intro` (`user_id`);--> statement-breakpoint
CREATE TABLE `business_pros` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`value` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `business_pros_user_id_idx` ON `business_pros` (`user_id`);--> statement-breakpoint
CREATE TABLE `email_format_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`email_tone` text,
	`email_description` text,
	`email_signature` text,
	`subject_templates` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `email_format_settings_user_id_idx` ON `email_format_settings` (`user_id`);--> statement-breakpoint
CREATE TABLE `smtp_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`smtp_username` text,
	`smtp_password` text,
	`smtp_host` text,
	`smtp_port` integer,
	`client_hostname` text,
	`ssl_tls_enabled` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `smtp_settings_user_id_idx` ON `smtp_settings` (`user_id`);