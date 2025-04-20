ALTER TABLE "chats" ADD COLUMN "notion_synced_at" timestamp;--> statement-breakpoint
ALTER TABLE "chats" DROP COLUMN "notion_verification_token";