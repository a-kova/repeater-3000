import { Rating } from 'ts-fsrs';
import Lesson from './lesson.js';
import { Card } from '../types.js';
import CompleteSentenceLesson from './completeSentenceLesson.js';
import MakeSentenceLesson from './makeSentenceLesson.js';
import RateWordLesson from './rateWordLesson.js';
import TranslateWordLesson from './translateWordLesson.js';
import TypeWordForTranslationLesson from './typeWordForTranslationLesson.js';
import { randomWeighted } from '../helpers/index.js';
import { RepeatWordsSceneContext } from '../services/telegram/index.js';

type LessonName =
  | 'completeSentence'
  | 'makeSentence'
  | 'rateWord'
  | 'translateWord'
  | 'typeWordForTranslation';

type LessonClass =
  | typeof CompleteSentenceLesson
  | typeof MakeSentenceLesson
  | typeof RateWordLesson
  | typeof TranslateWordLesson
  | typeof TypeWordForTranslationLesson;

const lessonWeights: Record<LessonName, number> = {
  completeSentence: 0.05,
  makeSentence: 0.05,
  rateWord: 0.7,
  translateWord: 0.15,
  typeWordForTranslation: 0.15,
};

function getClassByLessonName(name: LessonName): LessonClass {
  switch (name) {
    case 'completeSentence':
      return CompleteSentenceLesson;
    case 'makeSentence':
      return MakeSentenceLesson;
    case 'rateWord':
      return RateWordLesson;
    case 'translateWord':
      return TranslateWordLesson;
    case 'typeWordForTranslation':
      return TypeWordForTranslationLesson;
    default:
      throw new Error(`Unknown lesson type: ${name}`);
  }
}

function createRandomLesson({
  ctx,
  card,
  onFinish,
}: {
  ctx: RepeatWordsSceneContext;
  card: Card;
  onFinish: (rating: Rating) => Promise<void>;
}): Lesson {
  const lessonName = randomWeighted(lessonWeights);
  const LessonClass = getClassByLessonName(lessonName);

  return new LessonClass({ ctx, card, onFinish });
}

export { Lesson, createRandomLesson };
