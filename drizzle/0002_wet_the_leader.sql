ALTER TABLE `user` ADD `subscription_plan` text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `subscription_expiry` integer;