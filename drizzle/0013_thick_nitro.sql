ALTER TABLE "cards" DROP CONSTRAINT "cards_notion_page_id_unique";--> statement-breakpoint
ALTER TABLE "cards" DROP COLUMN "notion_page_id";--> statement-breakpoint
ALTER TABLE "chats" DROP COLUMN "notion_synced_at";