import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const chatsTable = pgTable('chats', {
  id: integer('id').primaryKey(),
  username: varchar('username', { length: 255 }),
  is_active: boolean('is_active').notNull().default(true),
  is_paid: boolean('is_paid').notNull().default(false),
  notification_time: varchar('notification_time', { length: 255 }).$default(
    () => '12:00'
  ),
});

export const cardsTable = pgTable(
  'cards',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    chat_id: integer('chat_id')
      .notNull()
      .references(() => chatsTable.id),
    word: varchar('word', { length: 255 }).notNull(),
    meaning: varchar('meaning', { length: 255 }),
    example: varchar('example', { length: 255 }),
    due: timestamp('due').notNull(),
    stability: numeric('stability').notNull(),
    difficulty: numeric('difficulty').notNull(),
    elapsed_days: integer('elapsed_days').notNull(),
    scheduled_days: integer('scheduled_days').notNull(),
    reps: integer('reps').notNull(),
    lapses: integer('lapses').notNull(),
    state: integer('state').notNull(),
    last_review: timestamp('last_review'),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    chatIdWordIdx: index('chat_id_word_idx').on(table.chat_id, table.word),
    chatIdLastReviewIdx: index('chat_id_last_review_idx').on(
      table.chat_id,
      table.last_review
    ),
  })
);
