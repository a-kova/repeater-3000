import { Scenes, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { Rating } from 'ts-fsrs';
import { rateCard, getCardsForToday } from '../../../repositories/card.js';
import { getChatById } from '../../../repositories/chat.js';
import type { Chat } from '../../../types.js';
import Lesson from '../../../lessons/lesson.js';
import { createRandomLesson } from '../../../lessons/index.js';
import { makeT } from '../../i18n.js';

interface SessionData extends Scenes.SceneSessionData {
  chat?: Chat;
  lessons?: Lesson[];
  activeLessonIndex?: number;
}

export type RepeatWordsSceneContext = Scenes.SceneContext<SessionData>;

const scene = new Scenes.BaseScene<RepeatWordsSceneContext>('repeatWordsScene');

const buildResultMessage = (lessons: Lesson[], t: (s: string) => string) => {
  const messageLines = [
    t("That's it! You have no more words to repeat today."),
    t("Today's words:"),
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
  const chat = await getChatById(ctx.chat!.id);
  const t = makeT(chat.original_language);
  const cards = await getCardsForToday(chat.id);

  if (cards.length === 0) {
    await ctx.reply(t('No words to repeat today'), {
      reply_markup: { remove_keyboard: true },
    });
    return ctx.scene.leave();
  }

  ctx.scene.session.chat = chat;
  ctx.scene.session.activeLessonIndex = 0;

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
          const message = buildResultMessage(ctx.scene.session.lessons!, t);
          await ctx.replyWithHTML(message, Markup.removeKeyboard());
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
