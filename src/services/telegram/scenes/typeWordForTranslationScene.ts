import { Markup, Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import { Rating } from 'ts-fsrs';
import { BotContext, enterRandomLessonScene } from '../index.js';
import { rateCard } from '../../../repositories/card.js';
import { normaliseWord } from '../../../helpers/index.js';

const scene = new Scenes.BaseScene<BotContext>('typeWordForTranslationScene');

scene.enter(async (ctx) => {
  if (!ctx.card) {
    await ctx.reply('No card to rate.');
    return ctx.scene.leave();
  }

  ctx.scene.session.card = ctx.card;
  const { translation } = ctx.card;

  await ctx.replyWithHTML(
    `Type the word for this translation: <b>${translation}</b>`,
    Markup.removeKeyboard()
  );
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
