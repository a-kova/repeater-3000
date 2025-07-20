import { Markup, Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import { Rating } from 'ts-fsrs';
import { BotContext, enterRandomLessonScene } from '../index.js';
import { rateCard } from '../../../repositories/card.js';
import { normaliseWord } from '../../../helpers/index.js';

const scene = new Scenes.BaseScene<BotContext>('completeSentenceScene');

scene.enter(async (ctx) => {
  const card = ctx.scene.state.card;

  if (!card) {
    await ctx.reply('No card to rate.');
    return ctx.scene.leave();
  }

  ctx.scene.session.card = card;

  const { word, example, example_translation } = card;

  const { message_id } = await ctx.replyWithHTML(
    `Complete the sentence: \n\n${example_translation} \n\n <b>${example?.replace(
      word,
      '______'
    )}</b>`,
    Markup.inlineKeyboard([
      Markup.button.callback("❌ Don't remember", 'dontRemember'),
    ])
  );

  ctx.scene.session.questionMessageId = message_id;
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
  await ctx.replyWithHTML(`The correct word is: <b>${card.word}</b>`);

  return enterRandomLessonScene(ctx);
});

scene.on(message('text'), async (ctx) => {
  await ctx.sendChatAction('typing');

  await ctx.telegram.editMessageReplyMarkup(
    ctx.chat.id,
    ctx.scene.session.questionMessageId,
    undefined,
    { inline_keyboard: [] }
  );

  const userInput = ctx.message.text.trim();
  const { card } = ctx.scene.session;

  if (!card) {
    await ctx.reply('No word to check.');
    return ctx.scene.leave();
  }

  const isCorrect = normaliseWord(userInput) === normaliseWord(card.word);

  await rateCard(card, isCorrect ? Rating.Good : Rating.Again);
  await (isCorrect
    ? ctx.reply('Correct! Well done!')
    : ctx.replyWithHTML(`Wrong. The correct word is: <b>${card.word}</b>`));

  return enterRandomLessonScene(ctx);
});

export default scene;
