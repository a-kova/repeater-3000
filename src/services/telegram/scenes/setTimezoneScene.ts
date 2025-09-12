import { Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import { updateChat } from '../../../repositories/chat.js';
import i18n from '../../i18n.js';
import { timezoneKeyboard } from '../keyboards.js';
import { timezones } from '../../../constants.js';

const scene = new Scenes.BaseScene<Scenes.SceneContext>('setTimezoneScene');

scene.enter(async (ctx) => {
  return ctx.replyWithHTML(
    i18n.__(
      'Please choose your timezone so that I can send notifications at the right time'
    ),
    timezoneKeyboard
  );
});

scene.on(message('text'), async (ctx) => {
  await ctx.sendChatAction('typing');

  const chatId = ctx.chat.id;
  const text = ctx.message.text;
  const timezone = timezones.find((tz) => tz.label === text);

  if (!timezone) {
    return ctx.reply(
      i18n.__('Please select a valid timezone from the list'),
      timezoneKeyboard
    );
  }

  await updateChat(chatId, { timezone: timezone.value });
  return ctx.scene.enter('setNotificationTimeScene');
});

export default scene;
