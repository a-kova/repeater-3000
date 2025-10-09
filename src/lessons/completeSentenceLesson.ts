import { Rating } from 'ts-fsrs';
import Lesson from './lesson.js';
import { normaliseWord } from '../helpers/index.js';
import { createSentenceWithEmptySpace } from '../services/openai.js';

class CompleteSentenceLesson extends Lesson {
  async start(): Promise<void> {
    const normalisedWord = normaliseWord(this.card.word);
    const sentence = await createSentenceWithEmptySpace(normalisedWord);

    const { message_id } = await this.ctx.replyWithHTML(
      `${this.t('Enter missing word:')} \n\n <b>${sentence}</b>`,
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
      this.clearKeyboard(),
      this.ctx.replyWithHTML(replyMessage),
    ]);

    await this.onFinish(isCorrect ? Rating.Good : Rating.Again);
  }
}

export default CompleteSentenceLesson;
