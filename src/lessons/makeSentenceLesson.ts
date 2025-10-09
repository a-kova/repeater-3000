import { Rating } from 'ts-fsrs';
import Lesson from './lesson.js';
import { checkWordUsageInSentence } from '../services/openai.js';

class MakeSentenceLesson extends Lesson {
  async start(): Promise<void> {
    const { message_id } = await this.ctx.replyWithHTML(
      `${this.t('Make a sentence with the word')} <b>${this.card.word}</b>`,
      this.keyboardWithDontRememberButton()
    );

    this.questionMessageId = message_id;
  }

  async onText(message: string) {
    const [{ isCorrect, comment }] = await Promise.all([
      checkWordUsageInSentence(this.card.word, message),
      this.ctx.sendChatAction('typing'),
      this.clearKeyboard(),
    ]);

    await this.ctx.replyWithHTML(
      isCorrect
        ? `✅ ${this.t('Correct')}`
        : `❌ ${this.t('Wrong')} \n\n ${comment}`
    );

    await this.onFinish(isCorrect ? Rating.Good : Rating.Again);
  }
}

export default MakeSentenceLesson;
