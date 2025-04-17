import { Card } from 'ts-fsrs';

export type PageData = {
  id: string;
  Word: string;
  Meaning: string;
  Example: string;
  created_time: string;
} & Card;
