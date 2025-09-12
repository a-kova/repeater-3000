import { Markup } from 'telegraf';
import { Rating } from 'ts-fsrs';
import Lesson from './lesson.js';
import i18n from '../services/i18n.js';

export const RATING_MAP = new Map([
  [`❌ ${i18n.__('No')}`, Rating.Again],
  [`🤔 ${i18n.__('Hardly')}`, Rating.Hard],
  [`✅ ${i18n.__('Yes')}`, Rating.Good],
  [`😎 ${i18n.__('Easy')}`, Rating.Easy],
]);

class RateWordLesson extends Lesson {
  async start() {
    const { word, translation, example } = this.card;

    const lines = [`${i18n.__('Remember this word?')} <b>${word}</b>`];

    if (translation && example) {
      lines.push(
        `\n<b>${i18n.__(
          'Translation:'
        )}</b> <tg-spoiler>${translation}</tg-spoiler>`,
        `<b>${i18n.__('Example:')}</b> <tg-spoiler>${example}</tg-spoiler>`
      );
    }

    const { message_id } = await this.ctx.replyWithHTML(
      lines.join('\n'),
      Markup.inlineKeyboard(
        Array.from(RATING_MAP.entries()).map(([text, rating]) =>
          Markup.button.callback(text, `rate:${rating}`)
        ),
        { columns: 2 }
      )
    );

    this.questionMessageId = message_id;
  }

  async onText() {
    await this.ctx.reply(i18n.__('Please use the buttons to rate the word'));
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
