import { BotContext } from '../index.js';
import { getHardestCards } from '../../../repositories/card.js';

export default async function hardestWordsCommand(ctx: BotContext) {
  await ctx.sendChatAction('typing');

  const chatId = ctx.chat!.id;
  const cards = await getHardestCards(chatId);

  if (cards.length < 5) {
    return await ctx.reply('Not enough data. Keep studying! 📚');
  }

  const list = cards.map(
    (card, index) => `${index + 1}. <b>${card.word}</b> — ${card.translation}`
  );

  await ctx.replyWithHTML(list.join('\n'));
}
