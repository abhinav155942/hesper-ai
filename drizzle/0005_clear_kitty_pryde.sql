PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_smtp_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`smtp_username` text,
	`smtp_password` text,
	`smtp_host` text,
	`smtp_port` integer,
	`client_hostname` text,
	`ssl_tls_enabled` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_smtp_settings`("id", "user_id", "smtp_username", "smtp_password", "smtp_host", "smtp_port", "client_hostname", "ssl_tls_enabled", "created_at", "updated_at") SELECT "id", "user_id", "smtp_username", "smtp_password", "smtp_host", "smtp_port", "client_hostname", "ssl_tls_enabled", "created_at", "updated_at" FROM `smtp_settings`;--> statement-breakpoint
DROP TABLE `smtp_settings`;--> statement-breakpoint
ALTER TABLE `__new_smtp_settings` RENAME TO `smtp_settings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `smtp_settings_user_id_idx` ON `smtp_settings` (`user_id`);