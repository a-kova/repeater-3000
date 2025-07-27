import { Markup, Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import { Rating } from 'ts-fsrs';
import { BotContext, enterRandomLessonScene } from '../index.js';
import { rateCard } from '../../../repositories/card.js';
import { normaliseWord } from '../../../helpers/index.js';

const scene = new Scenes.BaseScene<BotContext>('typeWordForTranslationScene');

scene.enter(async (ctx) => {
  const card = ctx.scene.state.card;

  if (!card) {
    await ctx.reply('No card to rate.');
    return ctx.scene.leave();
  }

  ctx.scene.session.card = card;
  const { translation } = card;

  await ctx.replyWithHTML(
    `Type the word for this translation: <b>${translation}</b>`,
    Markup.inlineKeyboard([
      Markup.button.callback("❌ Don't remember", 'dontRemember'),
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

  const isRight = normaliseWord(userInput) === normaliseWord(card.word);

  await rateCard(card, isRight ? Rating.Good : Rating.Again);

  await (isRight
    ? ctx.reply('Correct! Well done!')
    : ctx.replyWithHTML(`Wrong. The correct word is: <b>${card.word}</b>`));

  return enterRandomLessonScene(ctx);
});

export default scene;
