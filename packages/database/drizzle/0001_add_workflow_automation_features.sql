-- Add missing columns to automation_runs for workflow support
--> statement-breakpoint
ALTER TABLE `automation_runs` ADD COLUMN `triggered_by` text DEFAULT 'cron';
--> statement-breakpoint
ALTER TABLE `automation_runs` ADD COLUMN `approval_status` text DEFAULT 'none';
--> statement-breakpoint
ALTER TABLE `automation_runs` ADD COLUMN `approved_by` text;
--> statement-breakpoint
ALTER TABLE `automation_runs` ADD COLUMN `approved_at` text;
--> statement-breakpoint
ALTER TABLE `automation_runs` ADD COLUMN `context` text DEFAULT '{}';
--> statement-breakpoint
-- Add missing columns to automations for workflow support
--> statement-breakpoint
ALTER TABLE `automations` ADD COLUMN `workflow_version` integer DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `automations` ADD COLUMN `timezone` text DEFAULT 'UTC';
--> statement-breakpoint
ALTER TABLE `automations` ADD COLUMN `overlap_policy` text DEFAULT 'skip';
--> statement-breakpoint
-- Create workflow_steps table
--> statement-breakpoint
CREATE TABLE `workflow_steps` (
	`id` text PRIMARY KEY NOT NULL,
	`automation_id` text,
	`order` integer DEFAULT 0 NOT NULL,
	`type` text NOT NULL,
	`provider` text,
	`model` text,
	`prompt_template` text,
	`input_slot_bindings` text DEFAULT '{}',
	`output_slot_key` text,
	`condition_expr` text,
	`advanced_code` text,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`automation_id`) REFERENCES `automations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
-- Create automation_approval_policies table
--> statement-breakpoint
CREATE TABLE `automation_approval_policies` (
	`id` text PRIMARY KEY NOT NULL,
	`automation_id` text NOT NULL,
	`mode` text DEFAULT 'none' NOT NULL,
	`approver_role` text DEFAULT 'admin',
	`approver_user_ids` text DEFAULT '[]',
	`timeout_minutes` integer DEFAULT 60,
	`on_timeout` text DEFAULT 'pause',
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`automation_id`) REFERENCES `automations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
-- Create automation_run_steps table
--> statement-breakpoint
CREATE TABLE `automation_run_steps` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text,
	`step_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`output` text,
	`error` text,
	`started_at` text,
	`completed_at` text,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`run_id`) REFERENCES `automation_runs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`step_id`) REFERENCES `workflow_steps`(`id`) ON UPDATE no action ON DELETE no action
);
