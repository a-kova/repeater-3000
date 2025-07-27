import { Markup } from 'telegraf';
import { Rating } from 'ts-fsrs';
import Lesson from './lesson.js';
import { normaliseWord } from '../helpers/index.js';

class TypeWordForTranslationLesson extends Lesson {
  async start() {
    await this.ctx.replyWithHTML(
      `Type the word for this translation: <b>${this.card.translation}</b>`,
      Markup.inlineKeyboard([
        Markup.button.callback("❌ Don't remember", 'dontRemember'),
      ])
    );
  }

  async onText(message: string) {
    const isRight = normaliseWord(message) === normaliseWord(this.card.word);

    await (isRight
      ? this.ctx.reply('Correct! Well done!')
      : this.ctx.replyWithHTML(
          `Wrong. The correct word is: <b>${this.card.word}</b>`
        ));

    await this.onFinish(isRight ? Rating.Good : Rating.Again);
  }

  async onAction(action: string) {
    if (action !== 'dontRemember') {
      return;
    }

    await this.ctx.answerCbQuery();
    await this.ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    await this.onFinish(Rating.Again);

    const lines = [
      `<b>Translation:</b> ${this.card.translation}`,
      `<b>Example:</b> ${this.card.example}`,
    ];

    await this.ctx.replyWithHTML(lines.join('\n\n'));
  }
}

export default TypeWordForTranslationLesson;
