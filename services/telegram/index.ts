import { FastifyInstance } from 'fastify';
import { Context, Markup, Scenes, session, Telegraf } from 'telegraf';
import { addWordScene, removeWordScene } from './scenes';
import { cardsTable, chatsTable, db } from '../db';
import { updateFSRSData } from '../fsrs';
import { Rating } from 'ts-fsrs';
import { eq } from 'drizzle-orm';
import {
  convertFSRSDataToCardData,
  getFSRSDataFromCardData,
} from '../../helpers';
import { addRateWordAction } from './actions/rateWord';

let bot: Telegraf<Scenes.SceneContext>;

function initializeBot() {
  bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

  const stage = new Scenes.Stage([addWordScene, removeWordScene]);

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
      'Available commands: /start, /help, /add_word, /remove_word, /quit'
    )
  );

  bot.command('add_word', (ctx) => ctx.scene.enter('addWord'));
  bot.command('remove_word', (ctx) => ctx.scene.enter('removeWord'));

  bot.command('test', async (ctx) => {
    checkWord('saucy', 341627212);
  });

  addRateWordAction(bot);

  bot.command('quit', async (ctx) => {
    await db.delete(chatsTable).where(eq(chatsTable.id, ctx.chat.id));
    await db.delete(cardsTable).where(eq(cardsTable.chat_id, ctx.chat.id));
    await ctx.leaveChat();
  });

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  return bot;
}

export async function attachTelegrafToServer(server: FastifyInstance) {
  const bot = initializeBot();
  const webhook = await bot.createWebhook({ domain: process.env.HOST });

  server.post(`/telegraf/${bot.secretPathComponent()}`, async (req, reply) => {
    reply.hijack();
    // @ts-ignore
    req.raw.body = req.body;
    await webhook(req.raw, reply.raw);
  });
}

export async function checkWord(word: string, chatId: number) {
  bot.telegram.sendMessage(chatId, `Remember this word? <b>${word}</b>`, {
    parse_mode: 'HTML',
    ...Markup.inlineKeyboard([
      Markup.button.callback('No', `rate:${Rating.Again}:${word}`),
      Markup.button.callback('Hardly', `rate:${Rating.Hard}:${word}`),
      Markup.button.callback('Yes', `rate:${Rating.Good}:${word}`),
      Markup.button.callback('Easy', `rate:${Rating.Easy}:${word}`),
    ]),
  });
}
