import { Markup, Scenes, session, Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { scenes } from './scenes/index.js';
import { listWordsCommand, hardestWordsCommand } from './commands/index.js';
import { deleteChat } from '../../repositories/chat.js';
import { onMessageHandler, onStartHandler } from './handlers/index.js';
import type { RepeatWordsSceneContext } from './scenes/repeatWordsScene.js';

const bot = new Telegraf<Scenes.SceneContext>(process.env.TELEGRAM_BOT_TOKEN);

const stage = new Scenes.Stage(scenes);

bot.use(session());
bot.use(stage.middleware());

bot.start(onStartHandler);

bot.command('remove_word', (ctx) => ctx.scene.enter('removeWordScene'));

bot.command('list_words', listWordsCommand);

bot.command('time', (ctx) => ctx.scene.enter('notificationTimeScene'));

bot.command('repeat_now', (ctx) => ctx.scene.enter('repeatWordsScene'));

bot.command('hardest', hardestWordsCommand);

bot.command('quit', async (ctx) => {
  await deleteChat(ctx.chat.id);
  await ctx.reply('Bye! I will not bother you anymore.');
  await ctx.leaveChat();
});

bot.action('start_repeat', async (ctx) => {
  if (ctx.scene.current?.id === 'repeatWordsScene') {
    await ctx.scene.leave();
  }
  return ctx.scene.enter('repeatWordsScene');
});

bot.action('postpone_repeat', (ctx) =>
  ctx.reply('Okay, I will remind you tomorrow.')
);

bot.on(message('text'), onMessageHandler);

bot.catch(async (err, ctx) => {
  console.error(`Error for ${ctx.updateType}`, err);
  await ctx.reply('An error occurred while processing your request.');
});

async function notifyUser(chatId: number, wordsCount: number) {
  if (wordsCount === 0) {
    return;
  }

  const message = `You have <b>${wordsCount} word${
    wordsCount > 1 ? 's' : ''
  }</b> to repeat today. Ready?`;

  bot.telegram.sendMessage(chatId, message, {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      Markup.button.callback('Not now', 'postpone_repeat'),
      Markup.button.callback('Yes', 'start_repeat'),
    ]),
  });
}

export { bot, notifyUser, RepeatWordsSceneContext };
