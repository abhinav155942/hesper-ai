PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_business_differences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`value` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_business_differences`("id", "user_id", "value", "created_at", "updated_at") SELECT "id", "user_id", "value", "created_at", "updated_at" FROM `business_differences`;--> statement-breakpoint
DROP TABLE `business_differences`;--> statement-breakpoint
ALTER TABLE `__new_business_differences` RENAME TO `business_differences`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `business_differences_user_id_idx` ON `business_differences` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_business_intro` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`user_name` text,
	`business_description` text,
	`business_intro` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_business_intro`("id", "user_id", "user_name", "business_description", "business_intro", "created_at", "updated_at") SELECT "id", "user_id", "user_name", "business_description", "business_intro", "created_at", "updated_at" FROM `business_intro`;--> statement-breakpoint
DROP TABLE `business_intro`;--> statement-breakpoint
ALTER TABLE `__new_business_intro` RENAME TO `business_intro`;--> statement-breakpoint
CREATE INDEX `business_intro_user_id_idx` ON `business_intro` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_business_pros` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`value` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_business_pros`("id", "user_id", "value", "created_at", "updated_at") SELECT "id", "user_id", "value", "created_at", "updated_at" FROM `business_pros`;--> statement-breakpoint
DROP TABLE `business_pros`;--> statement-breakpoint
ALTER TABLE `__new_business_pros` RENAME TO `business_pros`;--> statement-breakpoint
CREATE INDEX `business_pros_user_id_idx` ON `business_pros` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_email_format_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`email_tone` text,
	`email_description` text,
	`email_signature` text,
	`subject_templates` text,
	`email_format` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_email_format_settings`("id", "user_id", "email_tone", "email_description", "email_signature", "subject_templates", "email_format", "created_at", "updated_at") SELECT "id", "user_id", "email_tone", "email_description", "email_signature", "subject_templates", "email_format", "created_at", "updated_at" FROM `email_format_settings`;--> statement-breakpoint
DROP TABLE `email_format_settings`;--> statement-breakpoint
ALTER TABLE `__new_email_format_settings` RENAME TO `email_format_settings`;--> statement-breakpoint
CREATE INDEX `email_format_settings_user_id_idx` ON `email_format_settings` (`user_id`);