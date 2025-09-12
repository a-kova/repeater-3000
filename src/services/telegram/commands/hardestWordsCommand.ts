import { Scenes } from 'telegraf';
import i18n from '../../i18n.js';
import { getHardestCards } from '../../../repositories/card.js';

export default async function hardestWordsCommand(ctx: Scenes.SceneContext) {
  await ctx.sendChatAction('typing');

  const chatId = ctx.chat!.id;
  const cards = await getHardestCards(chatId);

  if (cards.length < 5) {
    return await ctx.reply(i18n.__('Not enough data. Keep studying!') + ' 📚');
  }

  const list = cards.map(
    (card, index) => `${index + 1}. <b>${card.word}</b> — ${card.translation}`
  );

  await ctx.replyWithHTML(list.join('\n'));
}
