import { Scenes } from 'telegraf';
import { makeT } from '../../i18n.js';
import { getHardestCards } from '../../../repositories/card.js';
import { getChatById } from '../../../repositories/chat.js';

export default async function hardestWordsCommand(ctx: Scenes.SceneContext) {
  await ctx.sendChatAction('typing');

  const chatId = ctx.chat!.id;
  const chat = await getChatById(chatId);
  const t = makeT(chat.original_language);
  const cards = await getHardestCards(chatId);

  if (cards.length < 5) {
    return await ctx.reply(t('Not enough data. Keep studying!') + ' 📚');
  }

  const list = cards.map(
    (card, index) => `${index + 1}. <b>${card.word}</b> — ${card.translation}`
  );

  await ctx.replyWithHTML(list.join('\n'));
}
