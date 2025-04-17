import { Telegraf, Scenes } from 'telegraf';
import { Rating } from 'ts-fsrs';
import { cardsTable, db } from '../../db';
import { updateFSRSData } from '../../fsrs';
import {
  convertFSRSDataToCardData,
  getFSRSDataFromCardData,
} from '../../../helpers';
import { eq } from 'drizzle-orm';

export function addRateWordAction(
  bot: Telegraf<Scenes.SceneContext<Scenes.SceneSessionData>>
) {
  const regex = new RegExp(
    `^rate:(${Rating.Again}|${Rating.Good}|${Rating.Easy}):(.+)$`
  );

  bot.action(regex, async (ctx) => {
    const rating = parseInt(ctx.match[1]) as Rating;
    const word = ctx.match[2];
    const chatId = ctx.chat?.id;

    if (!chatId || !word) {
      await ctx.reply('Something went wrong. Please try again.');
      return;
    }

    await ctx.editMessageReplyMarkup({
      inline_keyboard: [],
    });

    const card = await db.query.cardsTable.findFirst({
      where: (table, { eq, and }) =>
        and(eq(table.chat_id, chatId), eq(table.word, word)),
    });

    if (!card) {
      await ctx.reply('Something went wrong. Please try again.');
      return;
    }

    const fsrsData = updateFSRSData(getFSRSDataFromCardData(card), rating);

    await db
      .update(cardsTable)
      .set(convertFSRSDataToCardData(fsrsData))
      .where(eq(cardsTable.id, card.id));

    if (rating === Rating.Easy) {
      return await ctx.reply('Great! You remembered it.');
    }

    if (rating === Rating.Good) {
      return await ctx.reply('Good job!');
    }

    if (!card.meaning && !card.example) {
      return await ctx.reply('Keep practicing!');
    }

    await ctx.replyWithHTML(
      `<b>Meaning:</b> ${card.meaning}\n\n<b>Example:</b> ${card.example}`
    );
  });
}
