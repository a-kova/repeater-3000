import { Scenes } from 'telegraf';
import { and, eq } from 'drizzle-orm';
import { cardsTable, db } from '../../db/index.js';
import { CustomContext } from '..';
import { deletePageForCard } from '../../notion.js';

const scene = new Scenes.BaseScene<CustomContext>('removeWord');

scene.enter(async (ctx) => {
  await ctx.reply('Please enter the word you want to remove:');
});

scene.on('text', async (ctx) => {
  await ctx.sendChatAction('typing');

  const chatId = ctx.chat.id;
  const word = ctx.message.text.trim().toLowerCase();

  const existingWord = await db.query.cardsTable.findFirst({
    where: (table, { eq }) => eq(table.chat_id, chatId),
  });

  if (!existingWord) {
    await ctx.reply("This word doesn't exist in your list.");
    await ctx.scene.leave();
    return;
  }

  const chat = await db.query.chatsTable.findFirst({
    where: (table, { eq }) => eq(table.id, chatId),
  });

  await db
    .delete(cardsTable)
    .where(and(eq(cardsTable.chat_id, chatId), eq(cardsTable.word, word)));

  if (chat && chat.is_paid && chat.notion_api_key && chat.notion_database_id) {
    deletePageForCard({
      card: existingWord,
      apiKey: chat.notion_api_key,
      databaseId: chat.notion_database_id,
    }).catch((error) => {
      console.error('Error deleting page:', error);
      ctx.reply('Failed to delete the page from Notion.');
    });
  }

  await ctx.reply(`The word "${word}" has been removed successfully!`);
  await ctx.scene.leave();
});

scene.on('message', async (ctx) => {
  await ctx.reply('Please enter a valid word.');
});

export default scene;
