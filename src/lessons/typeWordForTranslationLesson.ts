import { Rating } from 'ts-fsrs';
import Lesson from './lesson.js';
import { normaliseWord } from '../helpers/index.js';

class TypeWordForTranslationLesson extends Lesson {
  async start() {
    await this.ctx.replyWithHTML(
      `Type the word for this translation: <b>${this.card.translation}</b>`,
      this.keyboardWithDontRememberButton()
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
}

export default TypeWordForTranslationLesson;
