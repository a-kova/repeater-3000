import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const chatsTable = pgTable('chats', {
  id: integer('id').primaryKey(),
  first_name: varchar('first_name', { length: 255 }),
  last_name: varchar('last_name', { length: 255 }),
  username: varchar('username', { length: 255 }),
  original_language: varchar('original_language', { length: 2 })
    .notNull()
    .default('ru'),
  timezone: varchar('timezone', { length: 255 }).notNull().default('UTC'),
  is_active: boolean('is_active').notNull().default(true),
  is_paid: boolean('is_paid').notNull().default(true),
  notification_time_utc: varchar('notification_time_utc', {
    length: 255,
  }).$default(() => '12:00'),
});

export const cardsTable = pgTable(
  'cards',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    chat_id: integer('chat_id')
      .notNull()
      .references(() => chatsTable.id, { onDelete: 'cascade' }),
    word: varchar('word', { length: 255 }).notNull(),
    translation: varchar('translation', { length: 255 }),
    example: text('example'),
    example_translation: text('example_translation'),
    due: timestamp('due').notNull(),
    stability: numeric('stability').notNull(),
    difficulty: numeric('difficulty').notNull(),
    elapsed_days: integer('elapsed_days').notNull(),
    scheduled_days: integer('scheduled_days').notNull(),
    reps: integer('reps').notNull(),
    lapses: integer('lapses').notNull(),
    learning_steps: integer('learning_steps').notNull().default(0),
    state: integer('state').notNull(),
    last_review: timestamp('last_review'),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('chat_id_word_idx').on(table.chat_id, table.word),
    index('chat_id_due_idx').on(table.chat_id, table.due),
  ]
);
