import { Scenes } from 'telegraf';
import { cardExists, createCardForChat } from '../../../repositories/card.js';
import { CustomContext } from '..';
import { getChatById } from '../../../repositories/chat.js';

const scene = new Scenes.BaseScene<CustomContext>('addWord');

scene.enter(async (ctx) => {
  await ctx.reply('Please enter the word you want to add:');
});

scene.on('text', async (ctx) => {
  await ctx.sendChatAction('typing');

  const chatId = ctx.chat.id;
  const word = ctx.message.text.trim().toLowerCase();

  if (word.length < 3) {
    await ctx.reply('The word must be at least 3 characters long.');
    return;
  }

  const chat = await getChatById(chatId);

  if (!chat) {
    await ctx.reply('Please start the bot in a chat.');
    await ctx.scene.leave();
    return;
  }

  const exists = await cardExists({ word, chat_id: chatId });

  if (exists) {
    await ctx.reply('This word already exists in your list.');
    await ctx.scene.leave();
    return;
  }

  const card = await createCardForChat({ word }, chat);

  await ctx.replyWithHTML(
    `The word "${word}" has been added!\n\n<b>Tranlation: ${card.translation}\n\n<b>Example:</> ${card.example}`
  );
  await ctx.scene.leave();
});

scene.on('message', async (ctx) => {
  await ctx.reply('Please enter a valid word.');
});

export default scene;
