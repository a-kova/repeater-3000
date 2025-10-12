CREATE TABLE "words_info" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "words_info_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"word" varchar(255) NOT NULL,
	"original_language" varchar(2) NOT NULL,
	"translation" varchar(255) NOT NULL,
	"example" text NOT NULL,
	"base_form" varchar(255) NOT NULL,
	"importance" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "words_info_word_unique" UNIQUE("word")
);
--> statement-breakpoint
ALTER TABLE "cards" ALTER COLUMN "translation" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "cards" ALTER COLUMN "example" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ALTER COLUMN "timezone" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "chats" ALTER COLUMN "timezone" DROP NOT NULL;