import { Scenes } from 'telegraf';
import { cardExists, createCardForChat } from '../../../repositories/card.js';
import { getChatById } from '../../../repositories/chat.js';
import { makeT } from '../../i18n.js';

/* This handler processes incoming text messages to add new words to the user's vocabulary list. */
export default async function onMessageHandler(ctx: Scenes.SceneContext) {
  ctx.sendChatAction('typing');

  const chatId = ctx.chat!.id;
  const message = ctx.message;
  const chat = await getChatById(chatId);
  const t = makeT(chat.original_language);

  if (!message || typeof (message as any).text !== 'string') {
    return ctx.reply(t('Please send a text message'));
  }

  const word = (message as { text: string }).text.trim().toLowerCase();

  if (word.length < 3) {
    return ctx.reply(t('The word must be at least 3 characters long'));
  }

  if (/^[\p{L}\s-]+$/u.test(word) === false) {
    return ctx.reply(
      t('The word can only contain letters, spaces, and hyphens')
    );
  }

  try {
    const exists = await cardExists({ word, chat_id: chatId });

    if (exists) {
      return ctx.reply(t('This word already exists in your list'));
    }

    const card = await createCardForChat({ word }, chat!);

    let message = t('The word "%s" has been added!', word);

    if (card.translation) {
      message += `\n\n<b>${t('Translation:')}</b> ${card.translation}`;
    }

    if (card.example) {
      message += `\n\n<b>${t('Example:')}</b> ${card.example}`;
    }

    return ctx.replyWithHTML(message, {
      reply_markup: { remove_keyboard: true },
    });
  } catch (error) {
    console.error('Error adding word:', error);
    return ctx.reply(t('An error occurred, please try again later'));
  }
}
