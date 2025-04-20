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
  const chatId = ctx.chat?.id;

  if (!chatId) {
    await ctx.reply('Please start the bot in a chat.');
    return;
  }

  const chat = await db.query.chatsTable.findFirst({
    where: (table, { eq }) => eq(table.id, chatId),
  });

  await ctx.replyWithHTML(
    `Please select the time <b>in UTC</b> for your daily notification. (Current time: <i>${chat?.notification_time}</i>)`,
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
