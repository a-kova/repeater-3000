ALTER TABLE "cards" ADD COLUMN "notion_page_id" varchar(255);--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_notion_page_id_unique" UNIQUE("notion_page_id");