import { Markup } from 'telegraf';
import { Rating } from 'ts-fsrs';
import Lesson from './lesson.js';

export const RATING_MAP = [
  ['❌', 'No', Rating.Again],
  ['🤔', 'Hardly', Rating.Hard],
  ['✅', 'Yes', Rating.Good],
  ['😎', 'Easy', Rating.Easy],
] as const;

class RateWordLesson extends Lesson {
  async start() {
    const { word, translation, example } = this.card;

    const lines = [`${this.t('Remember this word?')} <b>${word}</b>`];

    if (translation && example) {
      lines.push(
        `\n<b>${this.t(
          'Translation:'
        )}</b> <tg-spoiler>${translation}</tg-spoiler>`,
        `<b>${this.t('Example:')}</b> <tg-spoiler>${example}</tg-spoiler>`
      );
    }

    const { message_id } = await this.ctx.replyWithHTML(
      lines.join('\n'),
      Markup.inlineKeyboard(
        RATING_MAP.map(([emoji, string, rating]) =>
          Markup.button.callback(`${emoji} ${this.t(string)}`, `rate:${rating}`)
        ),
        { columns: 2 }
      )
    );

    this.questionMessageId = message_id;
  }

  async onText() {
    await this.ctx.reply(this.t('Please use the buttons to rate the word'));
  }

  async onAction(action: string) {
    if (!action.startsWith('rate:')) {
      return;
    }

    const ratingValue = parseInt(action.split(':')[1]);
    await this.clearKeyboard();
    await this.onFinish(ratingValue);
  }
}

export default RateWordLesson;
