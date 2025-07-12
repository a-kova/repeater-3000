import { cardsTable } from './services/db/schema.js';

export const TelegramLessonScenes = [
  'completeSentenceScene',
  'makeSentenceScene',
  'rateWordScene',
  'typeWordForTranslationScene',
  'translateWordScene',
] as const;

export type TelegramLessonSceneName = (typeof TelegramLessonScenes)[number];

export type Card = typeof cardsTable.$inferSelect;
