import { Markup, Scenes } from 'telegraf';
import { Rating } from 'ts-fsrs';
import { CustomContext } from '..';
import { getCardsForToday, rateCard } from '../../../repositories/card.js';

const ratingMap = {
  '❌ No': Rating.Again,
  '🤔 Hardly': Rating.Hard,
  '✅ Yes': Rating.Good,
  '😎 Easy': Rating.Easy,
};

const scene = new Scenes.BaseScene<CustomContext>('repeatWords');

scene.enter(async (ctx) => {
  await ctx.sendChatAction('typing');

  const cards = await getCardsForToday(ctx.chat!.id);

  if (cards.length === 0) {
    await ctx.reply('Good job! No more words for today.');
    return await ctx.scene.leave();
  }

  const firstCard = cards[0];
  ctx.scene.session.card = firstCard;

  await ctx.replyWithHTML(
    `Remember this word? <b>${firstCard.word}</b>`,
    Markup.keyboard(Object.keys(ratingMap), { columns: 2 }).oneTime().resize()
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
