ALTER TABLE "chats" ADD COLUMN "username" varchar(255);--> statement-breakpoint
CREATE INDEX "chat_id_last_review_idx" ON "cards" USING btree ("chat_id","last_review");