import { Markup } from 'telegraf';
import { Rating } from 'ts-fsrs';
import Lesson from './lesson.js';
import { normaliseWord } from '../helpers/index.js';

class CompleteSentenceLesson extends Lesson {
  async start(): Promise<void> {
    const { word, example, example_translation } = this.card;

    const { message_id } = await this.ctx.replyWithHTML(
      `Complete the sentence: \n\n${example_translation} \n\n <b>${example?.replace(
        word,
        '______'
      )}</b>`,
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

    const isCorrect = normaliseWord(message) === normaliseWord(this.card.word);

    await (isCorrect
      ? this.ctx.reply('Correct! Well done!')
      : this.ctx.replyWithHTML(
          `Wrong. The correct word is: <b>${this.card.word}</b>`
        ));

    await this.onFinish(isCorrect ? Rating.Good : Rating.Again);
  }

  async onAction(action: string) {
    if (action !== 'dontRemember') {
      return;
    }

    await this.ctx.answerCbQuery();
    await this.ctx.editMessageReplyMarkup({ inline_keyboard: [] });

    const lines = [
      `<b>Word:</b> ${this.card.word}`,
      `<b>Example:</b> ${this.card.example}`,
      `<b>Translation:</b> ${this.card.translation}`,
    ];

    await this.ctx.replyWithHTML(lines.join('\n\n'));

    await this.onFinish(Rating.Again);
  }
}

export default CompleteSentenceLesson;
