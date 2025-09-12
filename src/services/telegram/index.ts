import { Markup, Scenes, session, Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { scenes } from './scenes/index.js';
import { listWordsCommand, hardestWordsCommand } from './commands/index.js';
import { createChat, deleteChat } from '../../repositories/chat.js';
import { onMessageHandler } from './handlers/index.js';
import type { RepeatWordsSceneContext } from './scenes/repeatWordsScene.js';
import i18n from '../i18n.js';

const bot = new Telegraf<Scenes.SceneContext>(process.env.TELEGRAM_BOT_TOKEN);

const stage = new Scenes.Stage(scenes);

bot.use(session());
bot.use(stage.middleware());

bot.use((ctx, next) => {
  const language = ctx.from?.language_code || 'ru';
  i18n.setLocale(language);
  return next();
});

bot.command('start', async (ctx) => {
  const language = ctx.from?.language_code || 'ru';

  await createChat({
    id: ctx.chat!.id,
    first_name: ctx.from!.first_name,
    last_name: ctx.from!.last_name,
    username: ctx.from!.username,
    original_language: language,
  });

  const introLines = [
    '🤖 ' + i18n.__('Yo! I’m Repeater 3000!'),
    i18n.__('Your pocket-sized word trainer — always ready to help!') + ' ⚡️',
    '',
    i18n.__('Here’s what I can do for you:'),
    '🕒 ' + i18n.__('Remind you to study — at a time <i>you</i> choose'),
    '📝 ' + i18n.__('Help you learn the words <i>you</i> pick'),
    '',
    i18n.__(
      'Just send me a word to get rolling. And don’t forget /time to set your reminder!'
    ) + ' 🎯',
  ];

  return ctx.replyWithHTML(introLines.join('\n'));
});

bot.command('remove_word', (ctx) => ctx.scene.enter('removeWordScene'));

bot.command('list_words', listWordsCommand);

bot.command('time', (ctx) => ctx.scene.enter('notificationTimeScene'));

bot.command('repeat_now', (ctx) => ctx.scene.enter('repeatWordsScene'));

bot.command('hardest', hardestWordsCommand);

bot.command('quit', async (ctx) => {
  await deleteChat(ctx.chat.id);
  await ctx.reply(i18n.__('Bye! I will not bother you anymore'));
  await ctx.leaveChat();
});

bot.action('start_repeat', async (ctx) => {
  if (ctx.scene.current?.id === 'repeatWordsScene') {
    await ctx.scene.leave();
  }
  return ctx.scene.enter('repeatWordsScene');
});

bot.action('postpone_repeat', (ctx) =>
  ctx.reply(i18n.__('Okay, I will remind you tomorrow'))
);

bot.on(message('text'), onMessageHandler);

bot.catch(async (err, ctx) => {
  console.error(`Error for ${ctx.updateType}`, err);
  await ctx.reply(i18n.__('An error occurred while processing your request'));
});

async function notifyUser(chatId: number, wordsCount: number) {
  if (wordsCount === 0) {
    return;
  }

  const message = i18n.__(
    'You have <b>%s</b> word(s) to repeat today. Ready?',
    wordsCount.toString()
  );

  bot.telegram.sendMessage(chatId, message, {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      Markup.button.callback(i18n.__('Not now'), 'postpone_repeat'),
      Markup.button.callback(i18n.__('Yes'), 'start_repeat'),
    ]),
  });
}

export { bot, notifyUser, RepeatWordsSceneContext };
