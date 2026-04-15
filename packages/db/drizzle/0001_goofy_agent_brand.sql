CREATE TABLE `conditions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`onset_date` text,
	`abatement_date` text,
	`source` text DEFAULT 'manual' NOT NULL,
	`source_resource_id` text,
	`icd10_code` text,
	`snomed_code` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `medications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`dosage` text,
	`frequency` text,
	`status` text DEFAULT 'active' NOT NULL,
	`start_date` text,
	`end_date` text,
	`source` text DEFAULT 'manual' NOT NULL,
	`source_resource_id` text,
	`rxnorm_code` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sync_batches` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`source` text NOT NULL,
	`status` text DEFAULT 'running' NOT NULL,
	`resources_fetched` integer DEFAULT 0 NOT NULL,
	`biomarkers_inserted` integer DEFAULT 0 NOT NULL,
	`full_history` integer DEFAULT false NOT NULL,
	`error_message` text,
	`started_at` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `biomarkers` ADD `abnormal_flag` text;--> statement-breakpoint
ALTER TABLE `biomarkers` ADD `confidence` real DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `raw_fhir_resources` ADD `payload_hash` text;--> statement-breakpoint
ALTER TABLE `raw_fhir_resources` ADD `sync_batch_id` text;