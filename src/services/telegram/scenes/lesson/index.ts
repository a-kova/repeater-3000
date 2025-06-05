import { Scenes } from 'telegraf';
import { Rating } from 'ts-fsrs';
import { CustomContext } from '../../index.js';
import { attachEnterSceneHandler } from './enterScene.js';
import { attachAnswerHandlers } from './answerHandlers.js';

export type LessonType = 'rate' | 'type' | 'select' | 'missing_word'

export const RATING_MAP = {
  '❌ No': Rating.Again,
  '🤔 Hardly': Rating.Hard,
  '✅ Yes': Rating.Good,
  '😎 Easy': Rating.Easy,
} as const;

export const LESSON_TYPE_WEIGHT: Record<LessonType, number> = {
  rate: 0.75,
  type: 0.1,
  select: 0.05,
  missing_word: 0.1,
} as const;

const scene = new Scenes.BaseScene<CustomContext>('lesson');

attachEnterSceneHandler(scene);
attachAnswerHandlers(scene);

export default scene;
