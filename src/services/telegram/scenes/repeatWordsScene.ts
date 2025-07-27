import { Scenes, Markup } from 'telegraf';
import { Rating } from 'ts-fsrs';
import { BotContext, enterRandomLessonScene } from '../index.js';
import { rateCard, getCardsForToday } from '../../../repositories/card.js';
import Lesson from '../../../lessons/lesson.js';
import RateWordLesson from '../../../lessons/rateWordLesson.js';
import { message } from 'telegraf/filters';

const scene = new Scenes.BaseScene<BotContext>('repeatWordsScene');

const buildResultMessage = (lessons: Lesson[]) => {
  const messageLines = [
    "That's it! You have no more words to repeat today.",
    "Your today's words:\n",
  ];

  lessons
    .filter((lesson) => lesson.rating !== null)
    .sort((a, b) => b.rating! - a.rating!)
    .forEach((lesson) => {
      const rating = lesson.rating!;
      const card = lesson.card;
      const signEmoji = rating < Rating.Good ? '🟡' : '🟢';

      messageLines.push(
        `${signEmoji} <b>${card.word}</b> - ${card.translation}`
      );
    });

  return messageLines.join('\n');
};

scene.enter(async (ctx) => {
  const cards = await getCardsForToday(ctx.chat!.id);

  if (cards.length === 0) {
    await ctx.reply('No words to repeat today.');
    return ctx.scene.leave();
  }

  const lessons: Lesson[] = cards.map(
    (card) =>
      new RateWordLesson({
        ctx,
        card,
        onFinish: async (rating) => {
          await rateCard(card, rating);
          const isFinished = ctx.scene.session.lessons!.every(
            (lesson) => lesson.is_finished
          );

          if (isFinished) {
            const message = buildResultMessage(ctx.scene.session.lessons!);
            await ctx.replyWithHTML(message);
            return ctx.scene.leave();
          }

          const nextLesson = ctx.scene.session.lessons!.find(
            (lesson) => !lesson.is_finished
          );
          nextLesson?.start();
        },
      })
  );

  ctx.scene.session.lessons = lessons;
  ctx.scene.session.activeLessonIndex = 0;

  lessons[0].start();
});

scene.on(message('text'), async (ctx) => {
  const currentLesson =
    ctx.scene.session.lessons![ctx.scene.session.activeLessonIndex!];
  const text = ctx.message.text.trim();
  currentLesson.onMessage(text);
});

scene.action(/rate:(\d+)/, async (ctx) => {
  const ratingValue = parseInt(ctx.match[1]);
  const card = ctx.scene.session.card!;

  await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  await rateCard(card, ratingValue);

  return enterRandomLessonScene(ctx);
});

export default scene;
