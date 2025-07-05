import { Scenes, Markup } from 'telegraf';
import { Rating } from 'ts-fsrs';
import { BotContext, enterRandomLessonScene } from '../index.js';
import { rateCard } from '../../../repositories/card.js';

export const RATING_MAP = {
  '❌ No': Rating.Again,
  '🤔 Hardly': Rating.Hard,
  '✅ Yes': Rating.Good,
  '😎 Easy': Rating.Easy,
} as const;

const scene = new Scenes.BaseScene<BotContext>('rateWordScene');

scene.enter(async (ctx) => {
  const card = ctx.scene.state.card;

  if (!card) {
    await ctx.reply('No card to rate.');
    return ctx.scene.leave();
  }

  ctx.scene.session.card = card;
  const { word, translation, example } = card;

  const lines = [`Remember this word? <b>${word}</b>`];

  if (translation && example) {
    lines.push(
      `\n<b>Translation:</b> <tg-spoiler>${translation}</tg-spoiler>`,
      `<b>Example:</b> <tg-spoiler>${example}</tg-spoiler>`
    );
  }

  await ctx.replyWithHTML(
    lines.join('\n'),
    Markup.inlineKeyboard(
      Object.entries(RATING_MAP).map(([label, value]) =>
        Markup.button.callback(label, `rate:${value}`)
      ),
      { columns: 2 }
    )
  );
});

scene.on('message', async (ctx) => {
  await ctx.reply('Please use the buttons to rate the word.');
});

scene.action(/rate:(\d+)/, async (ctx) => {
  const ratingValue = parseInt(ctx.match[1]);
  const card = ctx.scene.session.card!;

  await rateCard(card, ratingValue);

  return enterRandomLessonScene(ctx);
});

export default scene;
