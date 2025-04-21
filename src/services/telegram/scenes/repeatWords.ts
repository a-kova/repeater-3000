import { Markup, Scenes } from 'telegraf';
import { Rating } from 'ts-fsrs';
import { CustomContext } from '..';
import { getCardForToday, rateCard } from '../../../repositories/card.js';

const ratingMap = {
  '❌ No': Rating.Again,
  '🤔 Hardly': Rating.Hard,
  '✅ Yes': Rating.Good,
  '😎 Easy': Rating.Easy,
};

const scene = new Scenes.BaseScene<CustomContext>('repeatWords');

scene.enter(async (ctx) => {
  await ctx.sendChatAction('typing');

  const card = await getCardForToday(ctx.chat!.id);

  if (!card) {
    await ctx.reply("That's it, no more words for today.", {
      reply_markup: { remove_keyboard: true },
    });
    return await ctx.scene.leave();
  }

  ctx.scene.session.card = card;

  const textLines = [`Remember this word? <b>${card.word}</b>`];

  if (card.translation && card.example) {
    textLines.push(
      `\n<b>Translation:</b> <tg-spoiler>${card.translation}</tg-spoiler>`
    );
    textLines.push(`<b>Example:</b> <tg-spoiler>${card.example}</tg-spoiler>`);
  }

  await ctx.replyWithHTML(
    textLines.join('\n'),
    Markup.keyboard(Object.keys(ratingMap), { columns: 2 }).resize()
  );
});

scene.on('text', async (ctx) => {
  await ctx.sendChatAction('typing');

  if (!Object.prototype.hasOwnProperty.call(ratingMap, ctx.text)) {
    await ctx.reply('Please select a value.');
    return;
  }

  const rating = ratingMap[ctx.text as keyof typeof ratingMap];
  const card = ctx.scene.session.card!;

  try {
    await rateCard(card, rating);

    if (rating < Rating.Good && card.translation && card.example) {
      await ctx.replyWithHTML(
        `<b>Translation:</b> ${card.translation}\n\n<b>Example:</b> ${card.example}`
      );
    }

    await ctx.scene.reenter();
  } catch (error) {
    console.error('Error rating card:', error);
    await ctx.reply('An error occurred. Please try again later.');
    await ctx.scene.leave();
  }
});

scene.on('message', async (ctx) => {
  await ctx.reply('Please select a rating from the keyboard below.');
});

export default scene;
