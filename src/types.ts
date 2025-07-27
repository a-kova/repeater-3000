import { chatsTable, cardsTable } from './services/db/index.js';

export const TelegramLessonScenes = [
  'completeSentenceScene',
  'makeSentenceScene',
  'rateWordScene',
  'typeWordForTranslationScene',
  'translateWordScene',
] as const;

export type TelegramLessonSceneName = (typeof TelegramLessonScenes)[number];

export type Chat = typeof chatsTable.$inferSelect;
export type Card = typeof cardsTable.$inferSelect;
