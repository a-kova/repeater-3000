import cron from 'node-cron';
import { and, count, eq, inArray, lte } from 'drizzle-orm';
import { notifyUser } from './telegram/index.js';
import { db } from './db/index.js';
import { cardsTable, chatsTable } from './db/schema.js';

export function startCronJobs() {
  // Notify users about repeating words
  cron.schedule('0 * * * *', async () => {
    const now = new Date();
    const hour = now.getUTCHours() + 1;
    const notificationTime = `${hour < 10 ? '0' : ''}${hour}:00`;

    const chats = await db
      .select({ id: chatsTable.id })
      .from(chatsTable)
      .where(eq(chatsTable.notification_time, notificationTime));

    const chatIds = chats.map((chat) => chat.id);

    if (chatIds.length === 0) {
      return;
    }

    const endOfToday = new Date();
    endOfToday.setUTCHours(23, 59, 59, 999);

    const cards = await db
      .select({ count: count(), chat_id: cardsTable.chat_id })
      .from(cardsTable)
      .where(
        and(
          inArray(cardsTable.chat_id, chatIds),
          lte(cardsTable.due, endOfToday)
        )
      )
      .groupBy(cardsTable.chat_id);

    cards.forEach((card) => notifyUser(card.chat_id, card.count));
  });
}
