import { Rating } from 'ts-fsrs';
import { RepeatWordsSceneContext } from '../services/telegram/index.js';
import { Card } from '../types.js';

abstract class Lesson {
  protected ctx: RepeatWordsSceneContext;

  public readonly card: Card;

  protected questionMessageId?: number;

  protected onFinish: (rating: Rating) => Promise<void>;

  public rating: Rating | null = null;

  constructor({
    ctx,
    card,
    onFinish,
  }: {
    ctx: RepeatWordsSceneContext;
    card: Card;
    onFinish: (rating: Rating) => Promise<void>;
  }) {
    this.ctx = ctx;
    this.card = card;

    this.onFinish = async (rating: Rating) => {
      this.rating = rating;
      await onFinish(rating);
    };
  }

  get is_finished() {
    return this.rating !== null;
  }

  abstract start(): Promise<void>;

  abstract onText(message: string): Promise<void>;

  abstract onAction(action: string): Promise<void>;
}

export default Lesson;
