import { Scenes } from 'telegraf';
import { cardExists, createCardForChat } from '../../../repositories/card.js';
import { getChatById } from '../../../repositories/chat.js';
import i18n from '../../i18n.js';

export default async function onMessageHandler(ctx: Scenes.SceneContext) {
  await ctx.sendChatAction('typing');

  const chatId = ctx.chat!.id;
  const message = ctx.message;

  if (!message || typeof (message as any).text !== 'string') {
    return ctx.reply(i18n.__('Please send a text message'));
  }

  const word = (message as { text: string }).text.trim().toLowerCase();

  if (word.length < 3) {
    return ctx.reply(i18n.__('The word must be at least 3 characters long'));
  }

  if (/^[\p{L}\s-]+$/u.test(word) === false) {
    return ctx.reply(
      i18n.__('The word can only contain letters, spaces, and hyphens')
    );
  }

  try {
    const chat = await getChatById(chatId);
    const exists = await cardExists({ word, chat_id: chatId });

    if (exists) {
      return ctx.reply(i18n.__('This word already exists in your list'));
    }

    const card = await createCardForChat({ word }, chat!);

    let message = i18n.__('The word "%s" has been added!', word);

    if (card.translation) {
      message += `\n\n<b>${i18n.__('Translation')}:</b> ${card.translation}`;
    }

    if (card.example) {
      message += `\n\n<b>${i18n.__('Example')}:</b> ${card.example}`;
    }

    return ctx.replyWithHTML(message, {
      reply_markup: { remove_keyboard: true },
    });
  } catch (error) {
    console.error('Error adding word:', error);
    return ctx.reply(i18n.__('An error occurred, please try again later'));
  }
}
