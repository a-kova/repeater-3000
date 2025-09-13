import { Card as FSRSCard } from 'ts-fsrs';
import { fromZonedTime } from 'date-fns-tz';
import type { Card } from '../types.js';

export function omitProps<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };

  for (const key of keys) {
    delete result[key];
  }

  return result;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return false;
  }
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

export function toUTC(timeHHmm: string, timezone: string) {
  const [hours, minutes] = timeHHmm.split(':').map(Number);

  const now = new Date();
  const localDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes
  );

  const utcDate = fromZonedTime(localDate, timezone);

  const hh = String(utcDate.getUTCHours()).padStart(2, '0');
  const mm = String(utcDate.getUTCMinutes()).padStart(2, '0');

  return `${hh}:${mm}`;
}
