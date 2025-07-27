import { Rating } from 'ts-fsrs';
import Lesson from './lesson.js';
import { checkTranslation } from '../services/openai.js';

class TranslateWordLesson extends Lesson {
  async start(): Promise<void> {
    const { word } = this.card;

    await this.ctx.replyWithHTML(
      `Translate this word: <b>${word}</b>`,
      this.keyboardWithDontRememberButton()
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
}

export default TranslateWordLesson;
