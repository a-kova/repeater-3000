ALTER TABLE "chats" RENAME COLUMN "notification_time" TO "notification_time_utc";--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "timezone" varchar(255) DEFAULT 'UTC' NOT NULL;