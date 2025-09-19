import { Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import { updateChat } from '../../../repositories/chat.js';
import { getChatById } from '../../../repositories/chat.js';
import { getTimezoneForCity } from '../../openai.js';
import { makeT } from '../../i18n.js';

const scene = new Scenes.BaseScene<Scenes.SceneContext>('setTimezoneScene');

scene.enter(async (ctx) => {
  const chat = await getChatById(ctx.chat!.id);
  const t = makeT(chat.original_language);

  return ctx.reply(
    t('Please tell me your city so that I can determine your timezone')
  );
});

scene.on(message('text'), async (ctx) => {
  await ctx.sendChatAction('typing');

  const chatId = ctx.chat.id;
  const text = ctx.message.text;
  const chat = await getChatById(chatId);
  const t = makeT(chat.original_language);

  try {
    const timezone = await getTimezoneForCity(text);

    await updateChat(chatId, { timezone });
    await ctx.reply(t('Your timezone is %s', timezone));

    return ctx.scene.enter('setNotificationTimeScene');
  } catch (error) {
    console.error('Error setting timezone:', error);

    return ctx.reply(
      t('Something went wrong. Please make sure to enter a valid city name.')
    );
  }
});

export default scene;
