import { Markup } from 'telegraf';
import { Rating } from 'ts-fsrs';
import Lesson from './lesson.js';

export const RATING_MAP = {
  '❌ No': Rating.Again,
  '🤔 Hardly': Rating.Hard,
  '✅ Yes': Rating.Good,
  '😎 Easy': Rating.Easy,
} as const;

class RateWordLesson extends Lesson {
  async start() {
    const { word, translation, example } = this.card;

    const lines = [`Remember this word? <b>${word}</b>`];

    if (translation && example) {
      lines.push(
        `\n<b>Translation:</b> <tg-spoiler>${translation}</tg-spoiler>`,
        `<b>Example:</b> <tg-spoiler>${example}</tg-spoiler>`
      );
    }

    await this.ctx.replyWithHTML(
      lines.join('\n'),
      Markup.inlineKeyboard(
        Object.entries(RATING_MAP).map(([label, value]) =>
          Markup.button.callback(label, `rate:${value}`)
        ),
        { columns: 2 }
      )
    );
  }

  async onText() {
    await this.ctx.reply('Please use the buttons to rate the word.');
  }

  async onAction(action: string) {
    if (!action.startsWith('rate:')) {
      return;
    }

    const ratingValue = parseInt(action.split(':')[1]);
    await this.ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await this.onFinish(ratingValue);
  }
}

export default RateWordLesson;
