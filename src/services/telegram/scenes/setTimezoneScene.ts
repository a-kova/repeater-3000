import { Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import { updateChat } from '../../../repositories/chat.js';
import { getTimezoneForCity } from '../../openai.js';
import i18n from '../../i18n.js';

const scene = new Scenes.BaseScene<Scenes.SceneContext>('setTimezoneScene');

scene.enter(async (ctx) => {
  return ctx.reply(
    i18n.__('Please tell me your city so that I can determine your timezone')
  );
});

scene.on(message('text'), async (ctx) => {
  await ctx.sendChatAction('typing');

  const chatId = ctx.chat.id;
  const text = ctx.message.text;

  try {
    const timezone = await getTimezoneForCity(text);

    await updateChat(chatId, { timezone });
    await ctx.reply(i18n.__('Your timezone is %s', timezone));

    return ctx.scene.enter('setNotificationTimeScene');
  } catch (error) {
    console.error('Error setting timezone:', error);

    return ctx.reply(
      i18n.__(
        'Something went wrong. Please make sure to enter a valid city name.'
      )
    );
  }
});

export default scene;
