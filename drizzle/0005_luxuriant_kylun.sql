DROP INDEX "chat_id_last_review_idx";--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "notion_api_key" varchar(255);--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "notion_database_id" varchar(255);--> statement-breakpoint
CREATE INDEX "chat_id_due_idx" ON "cards" USING btree ("chat_id","due");