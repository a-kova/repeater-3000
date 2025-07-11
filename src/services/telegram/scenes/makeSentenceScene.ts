import { Markup, Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import { Rating } from 'ts-fsrs';
import { BotContext, enterRandomLessonScene } from '../index.js';
import { rateCard } from '../../../repositories/card.js';
import { checkWordUsageInSentence } from '../../openai.js';

const scene = new Scenes.BaseScene<BotContext>('makeSentenceScene');

scene.enter(async (ctx) => {
  const card = ctx.scene.state.card;

  if (!card) {
    await ctx.reply('No card to rate.');
    return ctx.scene.leave();
  }

  ctx.scene.session.card = card;
  const { word } = card;

  await ctx.replyWithHTML(
    `Make a sentence with the word <b>${word}</b>`,
    Markup.inlineKeyboard([
      Markup.button.callback("Don't remember", 'dontRemember'),
    ])
  );
});

scene.action('dontRemember', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.editMessageReplyMarkup({ inline_keyboard: [] });

  const { card } = ctx.scene.session;

  if (!card) {
    await ctx.reply('No card to rate.');
    return ctx.scene.leave();
  }

  await rateCard(card, Rating.Again);

  const lines = [
    `<b>Translation:</b> ${card.translation}`,
    `<b>Example:</b> ${card.example}`,
  ];

  await ctx.replyWithHTML(lines.join('\n\n'));

  return enterRandomLessonScene(ctx);
});

scene.on(message('text'), async (ctx) => {
  await ctx.sendChatAction('typing');

  const userInput = ctx.message.text.trim();
  const { card } = ctx.scene.session;

  if (!card) {
    await ctx.reply('No word to check.');
    return ctx.scene.leave();
  }

  const { isCorrect, comment } = await checkWordUsageInSentence(
    card.word,
    userInput
  );
  await rateCard(card, isCorrect ? Rating.Good : Rating.Again);
  await ctx.replyWithHTML(
    `${isCorrect ? '✅ Correct' : '❌ Wrong'} \n\n ${comment}`
  );

  return enterRandomLessonScene(ctx);
});

export default scene;
