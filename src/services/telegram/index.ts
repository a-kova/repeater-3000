import { FastifyInstance } from 'fastify';
import { Markup, Scenes, session, Telegraf } from 'telegraf';
import {
  removeWordScene,
  notificationTimeScene,
  repeatWordsScene,
} from './scenes/index.js';
import addWord from './handlers/addWord.js';
import { cardsTable } from '../db/index.js';
import { getAllCardsForChat } from '../../repositories/card.js';
import { createChat, deleteChat } from '../../repositories/chat.js';

interface CustomSceneSession extends Scenes.SceneSessionData {
  card?: typeof cardsTable.$inferSelect;
}

export type CustomContext = Scenes.SceneContext<CustomSceneSession>;

let bot: Telegraf<CustomContext>;

function initializeBot() {
  bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  const stage = new Scenes.Stage<CustomContext>([
    removeWordScene,
    notificationTimeScene,
    repeatWordsScene,
  ]);

  bot.use(session());
  bot.use(stage.middleware());

  bot.start(async (ctx) => {
    await ctx.sendChatAction('typing');

    await createChat({
      id: ctx.chat.id,
      first_name: ctx.from.first_name,
      last_name: ctx.from.last_name,
      username: ctx.from.username,
    });

    const introLines = [
      '🤖 Yo! I’m Repeater 3000!',
      'Your pocket-sized word trainer — always ready to help! ⚡️',
      '',
      'Here’s what I can do for you:',
      '🕒 Remind you to study — at a time <i>you</i> choose',
      '📝 Help you learn the words <i>you</i> pick',
      '',
      'Just send me a word to get rolling, or /time to set your reminder! 🎯',
    ];

    await ctx.replyWithHTML(introLines.join('\n'));
  });

  bot.on('text', async (ctx) => {
    await ctx.sendChatAction('typing');

    const chatId = ctx.chat.id;
    const word = ctx.message.text.trim().toLowerCase();

    const message = await addWord(chatId, word);

    await ctx.replyWithHTML(message, {
      reply_markup: { remove_keyboard: true },
    });
  });

  bot.command('remove_word', (ctx) => ctx.scene.enter('removeWord'));

  bot.command('list_words', async (ctx) => {
    await ctx.sendChatAction('typing');

    const chatId = ctx.chat.id;
    const cards = await getAllCardsForChat(chatId);

    if (cards.length === 0) {
      return await ctx.reply('No words found.');
    }

    const list = cards
      .map((card, index) => `${index + 1}. ${card.word}`)
      .join('\n');

    await ctx.replyWithHTML(list);
  });

  bot.command('time', (ctx) => ctx.scene.enter('notificationTime'));

  bot.command('repeat_now', (ctx) => ctx.scene.enter('repeatWords'));

  bot.command('quit', async (ctx) => {
    await deleteChat(ctx.chat.id);
    await ctx.reply('Bye! I will not bother you anymore.');
    await ctx.leaveChat();
  });

  bot.action('start_repeat', (ctx) => ctx.scene.enter('repeatWords'));

  bot.action('postpone_repeat', (ctx) =>
    ctx.reply('Okay, I will remind you tomorrow.')
  );

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  return bot;
}

export async function attachTelegrafToServer(server: FastifyInstance) {
  const bot = initializeBot();

  const webhook = await bot.createWebhook({ domain: process.env.HOST });

  server.post(`/telegraf/${bot.secretPathComponent()}`, async (req, reply) => {
    reply.hijack();
    // @ts-expect-error: req.raw is not a standard property
    req.raw.body = req.body;
    await webhook(req.raw, reply.raw);
  });
}

export async function notifyUser(chatId: number, wordsCount: number) {
  if (wordsCount === 0) {
    return;
  }

  const message = `You have <b>${wordsCount} word${
    wordsCount > 1 ? 's' : ''
  }</b> to repeat today. Ready?`;

  bot.telegram.sendMessage(chatId, message, {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      Markup.button.callback('No', 'postpone_repeat'),
      Markup.button.callback('Yes', 'start_repeat'),
    ]),
  });
}
