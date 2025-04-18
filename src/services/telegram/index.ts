import { FastifyInstance } from 'fastify';
import { Markup, Scenes, session, Telegraf } from 'telegraf';
import {
  addWordScene,
  removeWordScene,
  notificationTimeScene,
  repeatWordsScene,
} from './scenes/index.js';
import { cardsTable, chatsTable, db } from '../db/index.js';
import { eq } from 'drizzle-orm';

interface CustomSceneSession extends Scenes.SceneSessionData {
  cards?: (typeof cardsTable.$inferSelect)[];
}

export type CustomContext = Scenes.SceneContext<CustomSceneSession>;

let bot: Telegraf<CustomContext>;

function initializeBot() {
  bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  const stage = new Scenes.Stage<CustomContext>([
    addWordScene,
    removeWordScene,
    notificationTimeScene,
    repeatWordsScene,
  ]);

  bot.use(session());
  bot.use(stage.middleware());

  bot.start(async (ctx) => {
    await db
      .insert(chatsTable)
      .values({ id: ctx.chat.id })
      .onConflictDoNothing();

    ctx.reply('Welcome! Use /help to see available commands.');
  });

  bot.help((ctx) =>
    ctx.reply(
      'Available commands: /start, /help, /notification_time, /add_word, /list_words, /remove_word, /quit'
    )
  );

  bot.command('add_word', (ctx) => ctx.scene.enter('addWord'));

  bot.command('remove_word', (ctx) => ctx.scene.enter('removeWord'));

  bot.command('list_words', async (ctx) => {
    const chatId = ctx.chat.id;

    await ctx.sendChatAction('typing');

    const cards = await db.query.cardsTable.findMany({
      where: (table, { eq }) => eq(table.chat_id, chatId),
      orderBy: (table) => table.word,
    });

    if (cards.length === 0) {
      return await ctx.reply('No words found.');
    }

    await ctx.replyWithHTML(cards.map((card) => card.word).join('\n'));
  });

  bot.command('notification_time', (ctx) =>
    ctx.scene.enter('notificationTime')
  );

  bot.command('quit', async (ctx) => {
    await db.delete(cardsTable).where(eq(cardsTable.chat_id, ctx.chat.id));
    await db.delete(chatsTable).where(eq(chatsTable.id, ctx.chat.id));
    await ctx.leaveChat();
  });

  bot.action('start_repeat', async (ctx) => {
    const chatId = ctx.chat!.id;
    const now = new Date();

    const cards = await db.query.cardsTable.findMany({
      where: (table, { and, eq, lte }) =>
        and(eq(table.chat_id, chatId), lte(table.last_review, now)),
    });

    if (cards.length === 0) {
      return await ctx.reply('No words for today.');
    }

    ctx.scene.session.cards = cards;

    await ctx.scene.enter('repeatWords');
  });

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
