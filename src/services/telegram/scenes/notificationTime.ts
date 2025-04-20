import { Markup, Scenes } from 'telegraf';
import { chatsTable, db } from '../../../services/db/index.js';
import { eq } from 'drizzle-orm';
import { CustomContext } from '..';

const scene = new Scenes.BaseScene<CustomContext>('notificationTime');

const timeOptions = [];

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

scene.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const time = ctx.message.text;

  await ctx.sendChatAction('typing');

  if (!/^\d{2}:\d{2}$/.test(time)) {
    await ctx.reply('Please enter a valid time in HH:MM format.');
    return;
  }

  await db
    .update(chatsTable)
    .set({ notification_time: time })
    .where(eq(chatsTable.id, chatId));

  await ctx.reply(`Notification time updated to ${time}.`);
  await ctx.scene.leave();
});

scene.on('message', async (ctx) => {
  await ctx.scene.leave();
});

export default scene;
