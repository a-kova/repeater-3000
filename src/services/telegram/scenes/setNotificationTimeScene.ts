import { Markup, Scenes } from 'telegraf';
import { message } from 'telegraf/filters';
import { BotContext } from '../index.js';
import { updateChat } from '../../../repositories/chat.js';

const scene = new Scenes.BaseScene<BotContext>('setNotificationTimeScene');

const timeOptions = ['Turn off'];

for (let i = 0; i < 24; i++) {
  timeOptions.push(`${i < 10 ? '0' : ''}${i}:00`);
}

const timeKeyboard = Markup.keyboard(timeOptions, { columns: 2 }).oneTime();

scene.enter(async (ctx) => {
  await ctx.sendChatAction('typing');

  const hours = new Date().getUTCHours() + 1;
  const minutes = new Date().getUTCMinutes() + 1;
  const time = `${hours < 10 ? '0' : ''}${hours}:${
    minutes < 10 ? '0' : ''
  }${minutes}`;

  await ctx.replyWithHTML(
    `Please select the time <b>in UTC</b> for your daily notification.\n\nCurrent UTC time: <i>${time}</i>`,
    timeKeyboard
  );
});

scene.on(message('text'), async (ctx) => {
  const chatId = ctx.chat.id;
  const time = ctx.message.text;

  await ctx.sendChatAction('typing');

  if (time === 'Turn off') {
    await updateChat(chatId, { notification_time: null });
    await ctx.reply('Daily notifications have been turned off.');
    await ctx.scene.leave();
    return;
  }

  if (!/^\d{2}:\d{2}$/.test(time)) {
    await ctx.reply('Please enter a valid time in HH:MM format.');
    return;
  }

  await updateChat(chatId, { notification_time: time });

  await ctx.reply(`Notification time updated to ${time}.`);
  await ctx.scene.leave();
});

scene.on('message', (ctx) => ctx.scene.leave());

export default scene;
