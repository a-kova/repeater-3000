import { Card as FSRSCard } from 'ts-fsrs';
import type { Card } from '../types.js';

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
  data: FSRSCard
): Pick<Card, keyof FSRSCard> {
  return {
    ...data,
    stability: data.stability.toString(),
    difficulty: data.difficulty.toString(),
    last_review: data.last_review || null,
  };
}

export function getFSRSDataFromCardData(card: Card): FSRSCard {
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

export function shuffle<T>(arr: T[]): T[] {
  return arr
    .map((v) => [v, Math.random()] as const)
    .sort((a, b) => a[1] - b[1])
    .map(([v]) => v);
}

export function randomWeighted<T extends string | number | symbol>(
  items: Record<T, number>
): T {
  const totalWeight = (Object.values(items) as number[]).reduce(
    (sum, weight) => sum + weight,
    0
  );
  const random = Math.random() * totalWeight;
  let cumulativeWeight = 0;

  for (const [key, weight] of Object.entries(items) as [T, number][]) {
    cumulativeWeight += weight;
    if (random < cumulativeWeight) {
      return key;
    }
  }

  throw new Error('No item selected, check weights');
}

export function normaliseWord(word: string): string {
  return word.toLowerCase().replace(/^(to|a|an)\s+/, '');
}
