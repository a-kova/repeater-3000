import { Rating } from 'ts-fsrs';
import Lesson from './lesson.js';
import { normaliseWord } from '../helpers/index.js';

class TypeWordForTranslationLesson extends Lesson {
  async start() {
    const { message_id } = await this.ctx.replyWithHTML(
      `${this.t('Type the word for this translation:')} <b>${
        this.card.translation
      }</b>`,
      this.keyboardWithDontRememberButton()
    );

    this.questionMessageId = message_id;
  }

  async onText(message: string) {
    const isCorrect = normaliseWord(message) === normaliseWord(this.card.word);
    const replyMessage = isCorrect
      ? `✅ ${this.t('Correct! Well done!')}`
      : `❌ ${this.t('Wrong. The correct word is:')} <b>${this.card.word}</b>`;

    await Promise.all([
      this.ctx.sendChatAction('typing'),
      this.clearKeyboard(),
      this.ctx.replyWithHTML(replyMessage),
    ]);

    this.onFinish(isCorrect ? Rating.Good : Rating.Again);
  }
}

export default TypeWordForTranslationLesson;
