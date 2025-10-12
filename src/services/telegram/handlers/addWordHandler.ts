import { Scenes } from 'telegraf';
import { cardExists, createCardForChat } from '../../../repositories/card.js';
import { getChatById } from '../../../repositories/chat.js';
import { getWordInfoById } from '../../../repositories/wordInfo.js';
import { makeT } from '../../i18n.js';

export default async function addWordHandler(
  wordInfoId: number,
  ctx: Scenes.SceneContext
) {
  ctx.sendChatAction('typing');

  const chatId = ctx.chat!.id;
  const chat = await getChatById(chatId);
  const t = makeT(chat.original_language);
  const wordInfo = await getWordInfoById(wordInfoId);

  try {
    const exists = await cardExists({
      word: wordInfo.base_form,
      chat_id: chatId,
    });

    if (exists) {
      return ctx.reply(t('This word already exists in your list'));
    }

    const card = await createCardForChat(
      {
        word: wordInfo.base_form,
        translation: wordInfo.translation,
        example: wordInfo.example,
      },
      chat!
    );

    return ctx.replyWithHTML(t('The word "%s" has been added!', card.word), {
      reply_markup: { remove_keyboard: true },
    });
  } catch (error) {
    console.error('Error adding word:', error);
    return ctx.reply(t('An error occurred, please try again later'));
  }
}
