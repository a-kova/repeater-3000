import { Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import { Rating } from 'ts-fsrs';
import { rateCard, getCardsForToday } from '../../../repositories/card.js';
import Lesson from '../../../lessons/lesson.js';
import { createRandomLesson } from '../../../lessons/index.js';

interface SessionData extends Scenes.SceneSessionData {
  lessons?: Lesson[];
  activeLessonIndex?: number;
}

export type RepeatWordsSceneContext = Scenes.SceneContext<SessionData>;

const scene = new Scenes.BaseScene<RepeatWordsSceneContext>('repeatWordsScene');

const buildResultMessage = (lessons: Lesson[]) => {
  const messageLines = [
    "That's it! You have no more words to repeat today.",
    "Your today's words:\n",
  ];

  lessons
    .filter((lesson) => lesson.rating !== null)
    .sort((a, b) => {
      if (a.rating! !== b.rating!) {
        return a.rating! - b.rating!;
      }

      return a.card.word.localeCompare(b.card.word);
    })
    .map((lesson) => {
      const rating = lesson.rating!;
      const card = lesson.card;
      const signEmoji =
        rating < Rating.Hard ? '🔴' : rating < Rating.Good ? '🟡' : '🟢';

      return `${signEmoji} <b>${card.word}</b> - ${card.translation}`;
    })
    .forEach((line) => messageLines.push(line));

  return messageLines.join('\n');
};

scene.enter(async (ctx) => {
  const cards = await getCardsForToday(ctx.chat!.id);

  if (cards.length === 0) {
    console.log('No words to repeat today', ctx.scene.session);

    await ctx.reply('No words to repeat today.');
    return ctx.scene.leave();
  }

  const lessons: Lesson[] = cards.map((card) =>
    createRandomLesson({
      ctx,
      card,
      onFinish: async (rating) => {
        await rateCard(card, rating);
        const isFinished = ctx.scene.session.lessons!.every(
          (lesson) => lesson.isFinished
        );

        if (isFinished) {
          const message = buildResultMessage(ctx.scene.session.lessons!);
          await ctx.replyWithHTML(message);
          return ctx.scene.leave();
        }

        const nextLessonIndex = ctx.scene.session.lessons!.findIndex(
          (lesson) => !lesson.isFinished
        );

        if (nextLessonIndex !== -1) {
          ctx.scene.session.activeLessonIndex = nextLessonIndex;
          ctx.scene.session.lessons![nextLessonIndex].start();
        }
      },
    })
  );

  ctx.scene.session.lessons = lessons;
  ctx.scene.session.activeLessonIndex = 0;

  console.log('Starting a repeatWordsScene', ctx.scene.session);

  lessons[0].start();
});

scene.on(message('text'), async (ctx) => {
  const currentLesson =
    ctx.scene.session.lessons![ctx.scene.session.activeLessonIndex!];
  const text = ctx.message.text.trim();
  currentLesson.onText(text);
});

scene.action(/(.+)/, async (ctx) => {
  const currentLesson =
    ctx.scene.session.lessons![ctx.scene.session.activeLessonIndex!];
  const action = ctx.match[1];
  await currentLesson.onAction(action);
});

export default scene;
