import { Scenes } from 'telegraf';
import { getAllCardsForChat } from '../../../repositories/card.js';

export default async function listWordsCommand(ctx: Scenes.SceneContext) {
  await ctx.sendChatAction('typing');

  const chatId = ctx.chat!.id;
  const cards = await getAllCardsForChat(chatId);

  if (cards.length === 0) {
    return await ctx.reply('No words found.');
  }

  let list = cards.map((card, index) => `${index + 1}. ${card.word}`);

  if (list.length >= 100) {
    list.push('...');
  }

  await ctx.replyWithHTML(list.join('\n'));
}
