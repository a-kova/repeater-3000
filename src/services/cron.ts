import cron from 'node-cron';
import { and, count, eq, inArray, lte } from 'drizzle-orm';
import { notifyUser } from './telegram/index.js';
import { db } from './db/index.js';
import { cardsTable, chatsTable } from './db/schema.js';
import { NotionClient, PageData } from './notion.js';
import { getMeaningOfWord, getUsageExampleForWord } from './openai.js';
import { createNewFSRSData } from './fsrs.js';
import { convertFSRSDataToCardData } from '../helpers/index.js';

async function handleNotionPageUpdate(
  notionClient: NotionClient,
  chatId: number,
  page: PageData
) {
  if (page.archived) {
    await db.delete(cardsTable).where(eq(cardsTable.notion_page_id, page.id));
    return;
  }

  const existingCard = await db.query.cardsTable.findFirst({
    where: (cardsTable, { eq }) => eq(cardsTable.notion_page_id, page.id),
  });

  if (existingCard) {
    return;
  }

  const card = (
    await db
      .insert(cardsTable)
      .values({
        chat_id: chatId,
        word: page.word,
        meaning: page.meaning || (await getMeaningOfWord(page.word)),
        example: page.example || (await getUsageExampleForWord(page.word)),
        ...convertFSRSDataToCardData(createNewFSRSData()),
      })
      .returning()
  )[0];

  await notionClient.updatePageForCard(page.id, card);
}

export function startCronJobs() {
  // Notify users about their cards
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

    const cards = await db
      .select({ count: count(), chat_id: cardsTable.chat_id })
      .from(cardsTable)
      .where(
        and(inArray(cardsTable.chat_id, chatIds), lte(cardsTable.due, now))
      )
      .groupBy(cardsTable.chat_id);

    cards.forEach((card) => notifyUser(card.chat_id, card.count));
  });

  // Sync Notion pages with the database every 5 mins
  cron.schedule('*/5 * * * *', async () => {
    const chats = await db.query.chatsTable.findMany({
      where: (chatsTable, { and, eq, isNotNull }) =>
        and(
          eq(chatsTable.is_paid, true),
          isNotNull(chatsTable.notion_api_key),
          isNotNull(chatsTable.notion_database_id)
        ),
    });

    for (const chat of chats) {
      const notionClient = new NotionClient(
        chat.notion_api_key!,
        chat.notion_database_id!
      );

      let nextCursor: string | undefined = undefined;

      do {
        const result = await notionClient.getAllPagesFromDbEditedAfter(
          chat.notion_synced_at || new Date(0),
          nextCursor
        );

        nextCursor = result.nextCursor;

        for (const page of result.items) {
          await handleNotionPageUpdate(notionClient, chat.id, page);
        }
      } while (nextCursor);

      await db
        .update(chatsTable)
        .set({ notion_synced_at: new Date() })
        .where(eq(chatsTable.id, chat.id));
    }
  });
}
