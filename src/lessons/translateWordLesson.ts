import { Rating } from 'ts-fsrs';
import Lesson from './lesson.js';
import { checkTranslation } from '../services/openai.js';
import i18n from '../services/i18n.js';

class TranslateWordLesson extends Lesson {
  async start(): Promise<void> {
    const { word } = this.card;

    const { message_id } = await this.ctx.replyWithHTML(
      `${i18n.__('Translate this word:')} <b>${word}</b>`,
      this.keyboardWithDontRememberButton()
    );

    this.questionMessageId = message_id;
  }

  async onText(message: string) {
    await this.ctx.sendChatAction('typing');
    await this.clearKeyboard();

    const isCorrect =
      message === this.card.translation ||
      (await checkTranslation(this.card.word, message));

    if (isCorrect) {
      await this.ctx.reply(`✅ ${i18n.__('Correct')}`);
      await this.onFinish(Rating.Good);
    } else {
      await this.ctx.replyWithHTML(
        `❌ ${i18n.__('Wrong')}. ${i18n.__('The correct translation is:')} <b>${
          this.card.translation
        }</b>`
      );
      this.onFinish(Rating.Again);
    }
  }
}

export default TranslateWordLesson;
