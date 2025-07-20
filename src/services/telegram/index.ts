import { Markup, Scenes, session, Telegraf, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { scenes } from './scenes/index.js';
import { listWordsCommand, hardestWordsCommand } from './commands/index.js';
import { deleteChat } from '../../repositories/chat.js';
import { getCardForToday } from '../../repositories/card.js';
import { onMessageHandler, onStartHandler } from './handlers/index.js';
import { TelegramLessonSceneName, Card } from '../../types.js';
import { randomWeighted } from '../../helpers/index.js';

interface SceneSession extends Scenes.SceneSessionData {
  card?: Card;
  questionMessageId?: number;
}

interface BotContext extends Context {
  scene: Scenes.SceneContextScene<BotContext, SceneSession> & {
    state: {
      card?: Card;
    };
  };
}

const bot = new Telegraf<BotContext>(process.env.TELEGRAM_BOT_TOKEN);

const stage = new Scenes.Stage<BotContext>(scenes);

bot.use(session());
bot.use(stage.middleware());

bot.start(onStartHandler);

bot.command('remove_word', (ctx) => ctx.scene.enter('removeWordScene'));

bot.command('list_words', listWordsCommand);

bot.command('time', (ctx) => ctx.scene.enter('notificationTimeScene'));

bot.command('repeat_now', (ctx) => enterRandomLessonScene(ctx));

bot.command('hardest', hardestWordsCommand);

bot.command('quit', async (ctx) => {
  await deleteChat(ctx.chat.id);
  await ctx.reply('Bye! I will not bother you anymore.');
  await ctx.leaveChat();
});

bot.action('start_repeat', (ctx) => enterRandomLessonScene(ctx));

bot.action('postpone_repeat', (ctx) =>
  ctx.reply('Okay, I will remind you tomorrow.')
);

bot.on(message('text'), onMessageHandler);

bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}`, err);

  try {
    ctx.reply('An error occurred while processing your request.');
  } catch {}
});

async function enterRandomLessonScene(ctx: BotContext) {
  const card = await getCardForToday(ctx.chat!.id);

  if (!card) {
    await ctx.scene.leave();

    return bot.telegram.sendMessage(
      ctx.chat!.id,
      "That's it! You have no more words to repeat today.",
      Markup.removeKeyboard()
    );
  }

  const lessonWeights: Record<TelegramLessonSceneName, number> = {
    rateWordScene: 0.65,
    typeWordForTranslationScene: 0.1,
    completeSentenceScene: 0.1,
    makeSentenceScene: 0.1,
    translateWordScene: 0.15,
  };

  const sceneName = randomWeighted(lessonWeights);

  return ctx.scene.enter(sceneName, { card });
}

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

export { bot, notifyUser, enterRandomLessonScene, BotContext };
