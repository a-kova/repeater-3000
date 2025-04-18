import { Scenes } from 'telegraf';
import { cardsTable, db } from '../../../services/db';
import { createNewFSRSData } from '../../fsrs';
import { convertFSRSDataToCardData } from '../../../helpers';
import { CustomContext } from '..';
import { getMeaningOfWord, getUsageExampleForWord } from '../../openai';

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
    where: (table, { and, eq }) =>
      and(eq(table.chat_id, chatId), eq(table.word, word)),
  });

  if (existingWord) {
    await ctx.reply('This word already exists in your list.');
    await ctx.scene.leave();
    return;
  }

  const chat = await db.query.chatsTable.findFirst({
    where: (table, { eq }) => eq(table.id, chatId),
  });

  if (!chat) {
    await ctx.reply('Please start the bot in a chat.');
    await ctx.scene.leave();
    return;
  }

  // const totalWords = await db.$count(
  //   cardsTable,
  //   eq(cardsTable.chat_id, chatId)
  // );

  // if (totalWords >= 100) {
  //   await ctx.reply(
  //     'You have reached the maximum number of words you can save.'
  //   );
  //   return;
  // }

  const newCardData: typeof cardsTable.$inferInsert = {
    chat_id: chatId,
    word,
    ...convertFSRSDataToCardData(createNewFSRSData()),
  };

  if (chat.is_paid) {
    const [meaning, example] = await Promise.all([
      getMeaningOfWord(word),
      getUsageExampleForWord(word),
    ]);

    newCardData.meaning = meaning;
    newCardData.example = example;
  }

  await db.insert(cardsTable).values(newCardData);

  await ctx.reply(`The word "${word}" has been added successfully!`);
  await ctx.scene.leave();
});

scene.on('message', async (ctx) => {
  await ctx.reply('Please enter a valid word.');
});

export default scene;
