import { Markup, Scenes } from 'telegraf';
import { Rating } from 'ts-fsrs';
import { CustomContext } from '..';
import { rateCard } from '../../../repositories/card.js';

const ratingMap = {
  '❌ No': Rating.Again,
  '🤔 Hardly': Rating.Hard,
  '✅ Yes': Rating.Good,
  '😎 Easy': Rating.Easy,
};

const scene = new Scenes.BaseScene<CustomContext>('repeatWords');

scene.enter(async (ctx) => {
  await ctx.sendChatAction('typing');

  const card = ctx.scene.session.cards?.[0];

  if (!card) {
    await ctx.reply('No words for today.');
    return await ctx.scene.leave();
  }

  await ctx.replyWithHTML(
    `Remember this word? <b>${card.word}</b>`,
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
  const card = ctx.scene.session.cards!.shift()!;

  await rateCard(card, rating);

  if (rating < Rating.Good && card.meaning && card.example) {
    await ctx.replyWithHTML(
      `<b>Translation:</b> ${card.translation}\n\n<b>Meaning:</b> ${card.meaning}\n\n<b>Example:</b> ${card.example}`
    );
  }

  if (ctx.scene.session.cards?.length) {
    return await ctx.scene.reenter();
  } else {
    await ctx.reply('Good job! No more words for today.');
    return await ctx.scene.leave();
  }
});

scene.on('message', async (ctx) => {
  await ctx.reply('Please select a rating from the keyboard below.');
});

export default scene;
