import { Scenes } from 'telegraf';
import { getChatById } from '../../../repositories/chat.js';
import { getOrCreateWordInfo } from '../../../repositories/wordInfo.js';
import { makeT } from '../../i18n.js';

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

  const wordInfo = await getOrCreateWordInfo(word, chat!.original_language);

  const messageLines = [
    `<b>${t('Base form:')}</b> ${wordInfo.base_form}`,
    `<b>${t('Importance:')}</b> ${wordInfo.importance}/10`,
    `<b>${t('Translation:')}</b> ${wordInfo.translation}`,
    `<b>${t('Example:')}</b> ${wordInfo.example}`,
  ];

  return ctx.replyWithHTML(messageLines.join('\n'), {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: t('Add to my list'),
            callback_data: `add_word:${wordInfo.id}`,
          },
        ],
      ],
    },
  });
}
