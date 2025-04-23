import { Markup, Scenes } from 'telegraf';
import { CustomContext } from '..';
import {
  cardExists,
  deleteCard,
  getAllCardsForChat,
} from '../../../repositories/card.js';

const scene = new Scenes.BaseScene<CustomContext>('removeWord');

scene.enter(async (ctx) => {
  await ctx.sendChatAction('typing');

  const cards = await getAllCardsForChat(ctx.chat!.id);
  const words = cards.map((card) => card.word);

  await ctx.reply(
    'Type the word you want to remove or select it from the list:',
    Markup.keyboard(words, { columns: 2 }).oneTime()
  );
});

scene.on('text', async (ctx) => {
  await ctx.sendChatAction('typing');

  const chatId = ctx.chat.id;
  const word = ctx.message.text.trim().toLowerCase();

  try {
    const exists = await cardExists({ word, chat_id: chatId });

    if (!exists) {
      await ctx.reply("This word doesn't exist in your list.");
      return await ctx.scene.leave();
    }

    await deleteCard({ word, chat_id: chatId });

    await ctx.reply(
      `The word "${word}" has been removed successfully!`,
      Markup.removeKeyboard()
    );
  } catch (error) {
    console.error('Error removing word:', error);
    await ctx.reply(
      'An error occurred while removing the word. Please try again later.',
      Markup.removeKeyboard()
    );
  } finally {
    await ctx.scene.leave();
  }
});

scene.on('message', (ctx) => ctx.reply('Please enter a valid word.'));

export default scene;
