import { Rating } from 'ts-fsrs';
import Lesson from './lesson.js';
import { normaliseWord } from '../helpers/index.js';
import { createSentenceWithEmptySpace } from '../services/openai.js';
import i18n from '../services/i18n.js';

class CompleteSentenceLesson extends Lesson {
  async start(): Promise<void> {
    const normalisedWord = normaliseWord(this.card.word);
    const sentence = await createSentenceWithEmptySpace(normalisedWord);

    const { message_id } = await this.ctx.replyWithHTML(
      `${i18n.__('Enter missing word:')} \n\n <b>${sentence}</b>`,
      this.keyboardWithDontRememberButton()
    );

    this.questionMessageId = message_id;
  }

  async onText(message: string) {
    await this.ctx.sendChatAction('typing');
    await this.clearKeyboard();

    const isCorrect = normaliseWord(message) === normaliseWord(this.card.word);

    await (isCorrect
      ? this.ctx.reply(`✅ ${i18n.__('Correct! Well done!')}`)
      : this.ctx.replyWithHTML(
          `❌ ${i18n.__('Wrong. The correct word is:')} <b>${
            this.card.word
          }</b>`
        ));

    await this.onFinish(isCorrect ? Rating.Good : Rating.Again);
  }
}

export default CompleteSentenceLesson;
