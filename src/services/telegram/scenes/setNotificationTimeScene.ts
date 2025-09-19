import { Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import { getChatById, updateChat } from '../../../repositories/chat.js';
import { toUTC } from '../../../helpers/index.js';
import { makeT } from '../../i18n.js';
import { getTimeKeyboard } from '../keyboards.js';

const scene = new Scenes.BaseScene<Scenes.SceneContext>(
  'setNotificationTimeScene'
);

scene.enter(async (ctx) => {
  await ctx.sendChatAction('typing');

  const chat = await getChatById(ctx.chat!.id);
  const t = makeT(chat.original_language);

  if (!chat.timezone) {
    return ctx.scene.enter('setTimezoneScene');
  }

  return ctx.replyWithHTML(
    t('Please select the time for your daily notification'),
    getTimeKeyboard(chat.original_language)
  );
});

scene.on(message('text'), async (ctx) => {
  await ctx.sendChatAction('typing');

  const chatId = ctx.chat.id;
  const time = ctx.message.text;
  const chat = await getChatById(chatId);
  const t = makeT(chat.original_language);

  if (time === t('Turn off')) {
    await updateChat(chatId, { notification_time_utc: null });
    await ctx.reply(t('Daily notifications have been turned off'));
    return ctx.scene.leave();
  }

  if (!/^\d{2}:\d{2}$/.test(time)) {
    return ctx.reply(t('Please enter a valid time in HH:MM format'));
  }

  await updateChat(chatId, {
    notification_time_utc: toUTC(time, chat.timezone!),
  });

  await ctx.reply(t('Notification time updated to %s', time));
  return ctx.scene.leave();
});

export default scene;
