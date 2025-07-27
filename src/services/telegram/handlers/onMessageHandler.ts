import { cardExists, createCardForChat } from '../../../repositories/card.js';
import { getChatById } from '../../../repositories/chat.js';
import { BotContext } from '../index.js';

export default async function onMessageHandler(ctx: BotContext) {
  await ctx.sendChatAction('typing');

  const chatId = ctx.chat!.id;
  const message = ctx.message;

  if (!message || typeof (message as any).text !== 'string') {
    return ctx.reply('Please send a text message.');
  }

  const word = (message as { text: string }).text.trim().toLowerCase();

  if (word.length < 3) {
    return ctx.reply('The word must be at least 3 characters long.');
  }

  try {
    const chat = await getChatById(chatId);
    const exists = await cardExists({ word, chat_id: chatId });

    if (exists) {
      return ctx.reply('This word already exists in your list.');
    }

    const card = await createCardForChat({ word }, chat!);

    let message = `The word "${word}" has been added!`;

    if (card.translation) {
      message += `\n\n<b>Translation:</b> ${card.translation}`;
    }

    if (card.example) {
      message += `\n\n<b>Example:</b> ${card.example}`;
    }

    return ctx.replyWithHTML(message, {
      reply_markup: { remove_keyboard: true },
    });
  } catch (error) {
    console.error('Error adding word:', error);

    return ctx.reply(
      'An error occurred while adding the word. Please try again.'
    );
  }
}
