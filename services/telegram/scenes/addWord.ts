import { Scenes } from 'telegraf';
import { cardsTable, db } from '../../../services/db';
import { eq } from 'drizzle-orm';
import { createNewFSRSData } from '../../fsrs';
import { getMeaningOfWord, getUsageExampleForWord } from '../../openai';
import { CustomContext } from '..';

const scene = new Scenes.BaseScene<CustomContext>('addWord');

scene.enter(async (ctx) => {
  await ctx.reply('Please enter the word you want to add:');
});

scene.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const word = ctx.message.text.trim().toLowerCase();

  if (word.length < 3) {
    await ctx.reply('The word must be at least 3 characters long.');
    return;
  }

  const existingWord = await db.query.cardsTable.findFirst({
    where: (table, { eq }) => eq(table.chat_id, chatId),
  });

  if (existingWord) {
    await ctx.reply('This word already exists in your list.');
    await ctx.scene.leave();
    return;
  }

  const totalWords = await db.$count(
    cardsTable,
    eq(cardsTable.chat_id, chatId)
  );

  if (totalWords >= 100) {
    await ctx.reply(
      'You have reached the maximum number of words you can save.'
    );
    return;
  }

  // const [meaning, example] = await Promise.all([
  //   getMeaningOfWord(word),
  //   getUsageExampleForWord(word),
  // ]);

  console.log('Chat ID:', chatId);
  console.log(createNewFSRSData());

  try {
    await db.insert(cardsTable).values({
      chat_id: chatId,
      word,
      ...createNewFSRSData(),
    });
  } catch (error) {
    console.error('Error inserting word into database:', error);
  }

  await ctx.reply(`The word "${word}" has been added successfully!`);
  await ctx.scene.leave();
});

scene.on('message', async (ctx) => {
  await ctx.reply('Please enter a valid word.');
});

export default scene;
