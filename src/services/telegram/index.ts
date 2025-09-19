import { Markup, Scenes, session, Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { scenes } from './scenes/index.js';
import { listWordsCommand, hardestWordsCommand } from './commands/index.js';
import {
  createChat,
  deleteChat,
  getChatById,
} from '../../repositories/chat.js';
import { onMessageHandler } from './handlers/index.js';
import type { RepeatWordsSceneContext } from './scenes/repeatWordsScene.js';
import { makeT } from '../i18n.js';

const bot = new Telegraf<Scenes.SceneContext>(process.env.TELEGRAM_BOT_TOKEN);

const stage = new Scenes.Stage(scenes);

bot.use(session());
bot.use(stage.middleware());

bot.command('start', async (ctx) => {
  await createChat({
    id: ctx.chat!.id,
    first_name: ctx.from!.first_name,
    last_name: ctx.from!.last_name,
    username: ctx.from!.username,
    original_language: ctx.from!.language_code,
  });

  const t = makeT(ctx.from!.language_code || 'ru');

  const introLines = [
    '🤖 ' + t('Yo! I’m Repeater 3000!'),
    t('Your pocket-sized word trainer — always ready to help!') + ' ⚡️',
    '',
    t('Here’s what I can do for you:'),
    '🕒 ' + t('Remind you to study — at a time <i>you</i> choose'),
    '📝 ' + t('Help you learn the words <i>you</i> pick'),
    '',
    t(
      'Just send me a word to get rolling. And don’t forget /time to set your reminder!'
    ) + ' 🎯',
  ];

  return ctx.replyWithHTML(introLines.join('\n'));
});

bot.command('remove_word', (ctx) => ctx.scene.enter('removeWordScene'));

bot.command('list_words', listWordsCommand);

bot.command('time', (ctx) => ctx.scene.enter('setNotificationTimeScene'));

bot.command('repeat_now', (ctx) => ctx.scene.enter('repeatWordsScene'));

bot.command('hardest', hardestWordsCommand);

bot.command('quit', async (ctx) => {
  const chat = await getChatById(ctx.chat!.id);
  const t = makeT(chat.original_language);

  await deleteChat(ctx.chat.id);
  await ctx.reply(t('Bye! I will not bother you anymore'));
  await ctx.leaveChat();
});

bot.action('start_repeat', async (ctx) => {
  if (ctx.scene.current?.id === 'repeatWordsScene') {
    await ctx.scene.leave();
  }
  return ctx.scene.enter('repeatWordsScene');
});

bot.action('postpone_repeat', async (ctx) => {
  const chat = await getChatById(ctx.chat!.id);
  const t = makeT(chat.original_language);

  return ctx.reply(t('Okay, I will remind you tomorrow'));
});

bot.on(message('text'), onMessageHandler);

bot.catch(async (err, ctx) => {
  console.error(`Error for ${ctx.updateType}`, err);
  const t = makeT(ctx.from?.language_code || 'ru');

  await ctx.reply(t('An error occurred while processing your request'));
});

async function notifyUser(chatId: number, wordsCount: number) {
  if (wordsCount === 0) return;

  const chat = await getChatById(chatId);
  const t = makeT(chat.original_language);

  const message = t(
    'You have <b>%s</b> word(s) to repeat today. Ready?',
    wordsCount.toString()
  );

  bot.telegram.sendMessage(chatId, message, {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      Markup.button.callback(t('Not now'), 'postpone_repeat'),
      Markup.button.callback(t('Yes'), 'start_repeat'),
    ]),
  });
}

export { bot, notifyUser, RepeatWordsSceneContext };
