import { BotContext } from '../index.js';
import { createChat } from '../../../repositories/chat.js';

export default async function onStartHandler(ctx: BotContext) {
  await ctx.sendChatAction('typing');

  await createChat({
    id: ctx.chat!.id,
    first_name: ctx.from!.first_name,
    last_name: ctx.from!.last_name,
    username: ctx.from!.username,
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
}
