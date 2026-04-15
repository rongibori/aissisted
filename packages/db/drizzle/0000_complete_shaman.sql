CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`resource` text NOT NULL,
	`resource_id` text,
	`detail` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `biomarker_trends` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`biomarker_name` text NOT NULL,
	`latest_value` real NOT NULL,
	`latest_unit` text NOT NULL,
	`latest_measured_at` text NOT NULL,
	`first_measured_at` text,
	`reading_count` integer DEFAULT 0 NOT NULL,
	`slope_30d` real,
	`rolling_avg_7d` real,
	`rolling_avg_30d` real,
	`rolling_avg_90d` real,
	`trend_direction` text DEFAULT 'new' NOT NULL,
	`computed_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `biomarkers` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`value` real NOT NULL,
	`unit` text NOT NULL,
	`source` text,
	`reference_range_low` real,
	`reference_range_high` real,
	`lab_panel_name` text,
	`measured_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `consent_records` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`consent_type` text NOT NULL,
	`version` text NOT NULL,
	`granted_at` text NOT NULL,
	`revoked_at` text,
	`ip_address` text,
	`user_agent` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `health_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`date_of_birth` text,
	`sex` text,
	`goals` text DEFAULT '[]' NOT NULL,
	`conditions` text DEFAULT '[]' NOT NULL,
	`medications` text DEFAULT '[]' NOT NULL,
	`allergies` text DEFAULT '[]' NOT NULL,
	`supplements` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `health_profiles_user_id_unique` ON `health_profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `health_signals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`signal_type` text NOT NULL,
	`domain` text NOT NULL,
	`biomarker_name` text,
	`severity` text NOT NULL,
	`value` real,
	`explanation` text NOT NULL,
	`source_ids` text,
	`effective_from` text NOT NULL,
	`effective_to` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `health_state_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`mode` text NOT NULL,
	`confidence_score` real NOT NULL,
	`domain_scores` text NOT NULL,
	`active_signals` text NOT NULL,
	`warnings` text NOT NULL,
	`missing_data_flags` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `integration_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`expires_at` text,
	`scope` text,
	`metadata` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`intent` text,
	`metadata` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `protocols` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`summary` text NOT NULL,
	`warnings` text DEFAULT '[]' NOT NULL,
	`signals` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `raw_fhir_resources` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text NOT NULL,
	`payload` text NOT NULL,
	`synced_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`protocol_id` text NOT NULL,
	`name` text NOT NULL,
	`dosage` text NOT NULL,
	`timing` text NOT NULL,
	`time_slot` text,
	`rationale` text NOT NULL,
	`score` real DEFAULT 0 NOT NULL,
	`safety_status` text DEFAULT 'allowed',
	`safety_note` text,
	FOREIGN KEY (`protocol_id`) REFERENCES `protocols`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session_history` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`source` text NOT NULL,
	`metric` text NOT NULL,
	`value` real NOT NULL,
	`measured_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `supplement_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`protocol_id` text,
	`recommendation_id` text,
	`supplement_name` text NOT NULL,
	`dosage` text,
	`time_slot` text,
	`taken_at` text,
	`skipped` integer DEFAULT false NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`protocol_id`) REFERENCES `protocols`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `supplement_stacks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`items` text DEFAULT '[]' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);