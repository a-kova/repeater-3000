import { Markup } from 'telegraf';
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

  get isFinished() {
    return this.rating !== null;
  }

  abstract start(): Promise<void>;

  abstract onText(message: string): Promise<void>;

  protected keyboardWithDontRememberButton() {
    return Markup.inlineKeyboard([
      Markup.button.callback("❌ Don't remember", 'dontRemember'),
    ]);
  }

  protected async clearKeyboard() {
    try {
      if (this.questionMessageId) {
        await this.ctx.telegram.editMessageReplyMarkup(
          this.ctx.chat!.id,
          this.questionMessageId,
          undefined,
          { inline_keyboard: [] }
        );
      }
    } catch (error) {
      console.error('Failed to clear keyboard:', error);
    }
  }

  async onAction(action: string): Promise<void> {
    if (action !== 'dontRemember') {
      throw new Error(`Unknown action: ${action}`);
    }

    await this.clearKeyboard();

    const lines = [
      `<b>Word:</b> ${this.card.word}`,
      `<b>Translation:</b> ${this.card.translation}`,
      `<b>Example:</b> ${this.card.example}`,
    ];

    await this.ctx.replyWithHTML(lines.join('\n\n'));

    await this.onFinish(Rating.Again);
  }
}

export default Lesson;
