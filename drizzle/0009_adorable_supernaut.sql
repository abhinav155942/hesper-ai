ALTER TABLE `user` ADD `daily_messages` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `last_reset_date` text;