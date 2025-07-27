import { Markup, Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import { BotContext } from '../index.js';
import {
  cardExists,
  deleteCard,
  getAllCardsForChat,
} from '../../../repositories/card.js';

const scene = new Scenes.BaseScene<BotContext>('removeWordScene');

scene.enter(async (ctx) => {
  await ctx.sendChatAction('typing');

  const cards = await getAllCardsForChat(ctx.chat!.id);
  const words = cards.map((card) => card.word);

  if (!words.length) {
    await ctx.reply('No words found in your list.');
    return await ctx.scene.leave();
  }

  await ctx.reply(
    'Type the word you want to remove or select it from the list:',
    Markup.keyboard(words, { columns: 2 }).oneTime()
  );
});

scene.on(message('text'), async (ctx) => {
  await ctx.sendChatAction('typing');

  const word = ctx.message.text.trim().toLowerCase();
  const chatId = ctx.chat!.id;

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
