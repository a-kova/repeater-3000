import { Markup } from 'telegraf';
import { Rating } from 'ts-fsrs';
import Lesson from './lesson.js';
import { checkTranslation } from '../services/openai.js';

class TranslateWordLesson extends Lesson {
  async start(): Promise<void> {
    const { word } = this.card;

    await this.ctx.replyWithHTML(
      `Translate this word: <b>${word}</b>`,
      Markup.inlineKeyboard([
        Markup.button.callback("❌ Don't remember", 'dontRemember'),
      ])
    );
  }

  async onText(message: string) {
    await this.ctx.sendChatAction('typing');

    const isCorrect =
      message === this.card.translation ||
      (await checkTranslation(this.card.word, message));

    if (isCorrect) {
      await this.ctx.reply('✅ Correct');
      await this.onFinish(Rating.Good);
    } else {
      await this.ctx.replyWithHTML(
        `❌ Wrong. The correct translation is: <b>${this.card.translation}</b>`
      );
      this.onFinish(Rating.Again);
    }
  }

  async onAction(action: string) {
    if (action !== 'dontRemember') {
      return;
    }

    await this.ctx.answerCbQuery();
    await this.ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const lines = [
      `<b>Translation:</b> ${this.card.translation}`,
      `<b>Example:</b> ${this.card.example}`,
    ];

    await this.ctx.replyWithHTML(lines.join('\n\n'));

    this.onFinish(Rating.Again);
  }
}

export default TranslateWordLesson;
