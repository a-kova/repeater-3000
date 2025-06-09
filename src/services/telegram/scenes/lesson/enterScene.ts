import { Markup, Scenes } from 'telegraf';
import { LESSON_TYPE_WEIGHT, RATING_MAP, type LessonType } from './index.js';
import type { CustomContext } from '../../index.js';
import {
  getCardForToday,
  getRandomCards,
} from '../../../../repositories/card.js';
import { shuffle } from '../../../../helpers/index.js';

function weightedRandomLesson(): LessonType {
  const rnd = Math.random();
  let acc = 0;

  for (const [type, weight] of Object.entries(LESSON_TYPE_WEIGHT) as Array<
    [LessonType, number]
  >) {
    acc += weight;
    if (rnd < acc) return type;
  }

  return 'rate';
}

async function promptRate(ctx: CustomContext) {
  const { word, translation, example } = ctx.scene.session.card!;
  const lines = [`Remember this word? <b>${word}</b>`];

  if (translation && example) {
    lines.push(
      `\n<b>Translation:</b> <tg-spoiler>${translation}</tg-spoiler>`,
      `<b>Example:</b> <tg-spoiler>${example}</tg-spoiler>`
    );
  }

  await ctx.replyWithHTML(
    lines.join('\n'),
    Markup.keyboard(Object.keys(RATING_MAP), { columns: 2 }).resize()
  );
}

async function promptType(ctx: CustomContext) {
  const { translation } = ctx.scene.session.card!;
  await ctx.replyWithHTML(
    `Type the word for this translation: <b>${translation}</b>`,
    Markup.removeKeyboard()
  );
}

async function promptSelect(ctx: CustomContext) {
  const { word, translation } = ctx.scene.session.card!;

  const distractors = await getRandomCards({
    chatId: ctx.chat!.id,
    except: word,
  });
  const options = shuffle([word, ...distractors.map((c) => c.word)]).map((w) =>
    Markup.button.callback(w, w)
  );

  await ctx.replyWithHTML(
    `Select the correct word for this translation: <b>${translation}</b>`,
    Markup.keyboard(options, { columns: 2 }).oneTime().resize()
  );
}

async function promptMissingWord(ctx: CustomContext) {
  const { word, example, example_translation } = ctx.scene.session.card!;

  await ctx.replyWithHTML(
    `Complete the sentence: \n\n${example_translation} \n\n <b>${example?.replace(
      word,
      '______'
    )}</b>`,
    Markup.removeKeyboard()
  );
}

export function attachEnterSceneHandler(
  scene: Scenes.BaseScene<CustomContext>
) {
  scene.enter(async (ctx) => {
    await ctx.sendChatAction('typing');

    const card = await getCardForToday(ctx.chat!.id);

    if (!card) {
      await ctx.reply(
        "That's it, no more words for today.",
        Markup.removeKeyboard()
      );
      return ctx.scene.leave();
    }

    const lessonType = weightedRandomLesson();

    ctx.scene.session.card = card;
    ctx.scene.session.lessonType = lessonType;

    switch (lessonType) {
      case 'rate':
        await promptRate(ctx);
        break;
      case 'select':
        await promptSelect(ctx);
        break;
      case 'type':
        await promptType(ctx);
        break;
      case 'missing_word':
        await promptMissingWord(ctx);
        break;
      default:
        await ctx.reply(
          'Unknown lesson type, please try again later.',
          Markup.removeKeyboard()
        );
        return ctx.scene.leave();
    }
  });
}
