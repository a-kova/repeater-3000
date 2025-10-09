import { Rating } from 'ts-fsrs';
import Lesson from './lesson.js';
import { checkTranslation } from '../services/openai.js';

class TranslateWordLesson extends Lesson {
  async start(): Promise<void> {
    const { word } = this.card;

    const { message_id } = await this.ctx.replyWithHTML(
      `${this.t('Translate this word:')} <b>${word}</b>`,
      this.keyboardWithDontRememberButton()
    );

    this.questionMessageId = message_id;
  }

  async onText(message: string) {
    const [isCorrect] = await Promise.all([
      message === this.card.translation ||
        checkTranslation(this.card.word, message),
      this.ctx.sendChatAction('typing'),
      this.clearKeyboard(),
    ]);

    if (isCorrect) {
      this.ctx.reply(`✅ ${this.t('Correct')}`);
      this.onFinish(Rating.Good);
    } else {
      this.ctx.replyWithHTML(
        `❌ ${this.t('Wrong')}. ${this.t('The correct translation is:')} <b>${
          this.card.translation
        }</b>`
      );
      this.onFinish(Rating.Again);
    }
  }
}

export default TranslateWordLesson;
