import { Markup, Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import {
  cardExists,
  deleteCard,
  getAllCardsForChat,
} from '../../../repositories/card.js';
import { makeT } from '../../i18n.js';
import { getChatById } from '../../../repositories/chat.js';

const scene = new Scenes.BaseScene<Scenes.SceneContext>('removeWordScene');

scene.enter(async (ctx) => {
  await ctx.sendChatAction('typing');

  const chat = await getChatById(ctx.chat!.id);
  const t = makeT(chat.original_language);
  const cards = await getAllCardsForChat(ctx.chat!.id);
  const words = cards.map((card) => card.word);

  if (!words.length) {
    await ctx.reply(t('No words found in your list'));
    return await ctx.scene.leave();
  }

  await ctx.reply(
    t('Type the word you want to remove or select it from the list below'),
    Markup.keyboard(words, { columns: 2 }).oneTime()
  );
});

scene.on(message('text'), async (ctx) => {
  await ctx.sendChatAction('typing');

  const word = ctx.message.text.trim().toLowerCase();
  const chatId = ctx.chat!.id;
  const chat = await getChatById(chatId);
  const t = makeT(chat.original_language);

  try {
    const exists = await cardExists({ word, chat_id: chatId });

    if (!exists) {
      await ctx.reply(t("This word doesn't exist in your list"));
      return await ctx.scene.leave();
    }

    await deleteCard({ word, chat_id: chatId });

    await ctx.reply(
      t('The word "%s" has been removed successfully!', word),
      Markup.removeKeyboard()
    );
  } catch (error) {
    console.error('Error removing word:', error);
    await ctx.reply(
      t('An error occurred, please try again later'),
      Markup.removeKeyboard()
    );
  } finally {
    await ctx.scene.leave();
  }
});

scene.on('message', async (ctx) => {
  const chat = await getChatById(ctx.chat!.id);
  const t = makeT(chat.original_language);

  return ctx.reply(t('Please enter a valid word'));
});

export default scene;
