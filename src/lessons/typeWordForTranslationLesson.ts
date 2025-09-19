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
    await this.ctx.sendChatAction('typing');
    await this.clearKeyboard();

    const isRight = normaliseWord(message) === normaliseWord(this.card.word);

    await (isRight
      ? this.ctx.reply(`✅ ${this.t('Correct! Well done!')}`)
      : this.ctx.replyWithHTML(
          `❌ ${this.t('Wrong')}. ${this.t('The correct word is:')} <b>${
            this.card.word
          }</b>`
        ));

    await this.onFinish(isRight ? Rating.Good : Rating.Again);
  }
}

export default TypeWordForTranslationLesson;
