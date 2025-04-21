import { Card } from 'ts-fsrs';
import { cardsTable } from '../services/db/index.js';

export function omitProps<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

export function toSnakeCase(str: string) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

export function convertFSRSDataToCardData(
  data: Card
): Pick<typeof cardsTable.$inferSelect, keyof Card> {
  return {
    ...data,
    stability: data.stability.toString(),
    difficulty: data.difficulty.toString(),
    last_review: data.last_review || null,
  };
}

export function getFSRSDataFromCardData(
  card: typeof cardsTable.$inferSelect
): Card {
  return {
    ...omitProps(card, [
      'id',
      'chat_id',
      'word',
      'translation',
      'example',
      'created_at',
    ]),
    stability: parseFloat(card.stability),
    difficulty: parseFloat(card.difficulty),
    last_review: card.last_review || undefined,
  };
}
