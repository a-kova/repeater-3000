import { chatsTable, cardsTable } from './services/db/index.js';

export type Chat = typeof chatsTable.$inferSelect;

export type Card = typeof cardsTable.$inferSelect;
