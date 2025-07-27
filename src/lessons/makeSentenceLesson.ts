import { Markup } from 'telegraf';
import { Rating } from 'ts-fsrs';
import Lesson from './lesson.js';
import { checkWordUsageInSentence } from '../services/openai.js';

class MakeSentenceLesson extends Lesson {
  async start(): Promise<void> {
    const { message_id } = await this.ctx.replyWithHTML(
      `Make a sentence with the word <b>${this.card.word}</b>`,
      Markup.inlineKeyboard([
        Markup.button.callback("❌ Don't remember", 'dontRemember'),
      ])
    );

    this.questionMessageId = message_id;
  }

  async onText(message: string) {
    await this.ctx.sendChatAction('typing');
    await this.ctx.telegram.editMessageReplyMarkup(
      this.ctx.chat!.id,
      this.questionMessageId,
      undefined,
      { inline_keyboard: [] }
    );

    const { isCorrect, comment } = await checkWordUsageInSentence(
      this.card.word,
      message
    );

    await this.ctx.replyWithHTML(
      `${isCorrect ? '✅ Correct' : '❌ Wrong'} \n\n ${comment}`
    );

    await this.onFinish(isCorrect ? Rating.Good : Rating.Again);
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

export default MakeSentenceLesson;
