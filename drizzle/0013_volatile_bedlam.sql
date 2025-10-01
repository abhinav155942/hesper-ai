ALTER TABLE `user` ADD `daily_basic_messages` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `daily_pro_messages` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `basic_daily_limit` integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `pro_daily_limit` integer DEFAULT 3 NOT NULL;