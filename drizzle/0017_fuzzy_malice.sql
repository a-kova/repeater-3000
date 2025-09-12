ALTER TABLE "chats" ADD COLUMN "original_language" varchar(2) DEFAULT 'ru' NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" DROP COLUMN "notion_api_key";--> statement-breakpoint
ALTER TABLE "chats" DROP COLUMN "notion_database_id";