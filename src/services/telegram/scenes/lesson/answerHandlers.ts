import { Scenes } from 'telegraf';
import { Rating } from 'ts-fsrs';
import { RATING_MAP } from './index.js';
import type { CustomContext } from '../../index.js';
import { rateCard } from '../../../../repositories/card.js';

const normalise = (s: string) => s.toLowerCase().replace(/^(to|a)\s+/, '');

export function attachAnswerHandlers(scene: Scenes.BaseScene<CustomContext>) {
  scene.on('text', async (ctx) => {
    await ctx.sendChatAction('typing');

    const lessonType = ctx.scene.session.lessonType;
    const card = ctx.scene.session.card!;
    const userInput = ctx.message.text.trim();

    try {
      switch (lessonType) {
        case 'select': {
          const correct = card.word;
          const isRight = userInput === correct;

          await rateCard(card, isRight ? Rating.Good : Rating.Again);
          await (isRight
            ? ctx.reply('Correct! Well done!')
            : ctx.replyWithHTML(
                `Wrong. The correct word is: <b>${correct}</b>`
              ));

          return ctx.scene.reenter();
        }

        case 'rate': {
          if (!Object.hasOwn(RATING_MAP, userInput)) {
            await ctx.reply('Please select a value.');
            return;
          }

          await rateCard(
            card,
            RATING_MAP[userInput as keyof typeof RATING_MAP]
          );
          return ctx.scene.reenter();
        }

        case 'type': {
          const isRight = normalise(userInput) === normalise(card.word);

          await rateCard(card, isRight ? Rating.Good : Rating.Again);

          await (isRight
            ? ctx.reply('Correct! Well done!')
            : ctx.replyWithHTML(
                `Wrong. The correct word is: <b>${card.word}</b>`
              ));

          return ctx.scene.reenter();
        }

        case 'missing_word': {
          const isCorrect = normalise(userInput) === normalise(card.word);

          await rateCard(card, isCorrect ? Rating.Good : Rating.Again);

          await (isCorrect
            ? ctx.reply('Correct! Well done!')
            : ctx.replyWithHTML(
                `Wrong. The correct word is: <b>${card.word}</b>`
              ));

          return ctx.scene.reenter();
        }

        default: {
          console.warn(`Unknown lessonType "${lessonType}" – leaving scene.`);
          return ctx.scene.leave();
        }
      }
    } catch (err) {
      console.error('Error rating card:', err);
      await ctx.reply('An error occurred. Please try again later.');
      await ctx.scene.leave();
    }
  });
}
