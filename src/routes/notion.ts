import { FastifyInstance } from 'fastify';
import { createEmptyCard } from 'ts-fsrs';
import { and, eq } from 'drizzle-orm';
import { cardsTable, db } from '../services/db/index.js';
import { getPageById, updatePageForCard } from '../services/notion.js';
import {
  getMeaningOfWord,
  getUsageExampleForWord,
} from '../services/openai.js';
import { convertFSRSDataToCardData } from '../helpers/index.js';

export default async function notionRoutes(server: FastifyInstance) {
  server.post('/api/notion', async (req, reply) => {
    const event = req.body as {
      id: string;
      type: string;
      data: {
        parent: {
          id: string;
        };
      };
    };

    if (!event || !event.type) {
      return reply.status(400).send({ error: 'Invalid event payload' });
    }

    if (event.type !== 'page.created' && event.type !== 'page.deleted') {
      return reply.status(400).send({ error: 'Unsupported event type' });
    }

    const pageId = event.id;
    const databaseId = event.data.parent.id;

    const chat = await db.query.chatsTable.findFirst({
      where: (chatsTable, { and, eq }) =>
        and(
          eq(chatsTable.is_paid, true),
          eq(chatsTable.notion_database_id, databaseId)
        ),
    });

    if (!chat) {
      return reply.status(404).send({ error: 'Chat not found' });
    }

    const page = await getPageById(chat.notion_api_key!, pageId);

    if (!page) {
      return reply.status(404).send({ error: 'Page not found' });
    }

    // @ts-expect-error: Type 'undefined' is not assignable to type 'string'
    const word = page.properties.Word.title[0].plain_text;

    if (event.type === 'page.deleted') {
      await db
        .delete(cardsTable)
        .where(and(eq(cardsTable.chat_id, chat.id), eq(cardsTable.word, word)));

      return reply.send({ success: true });
    }

    const [meaning, example] = await Promise.all([
      getMeaningOfWord(word),
      getUsageExampleForWord(word),
    ]);

    const fsrsData = createEmptyCard();

    const cardData = {
      word,
      meaning,
      example,
      chat_id: chat.id,
      ...convertFSRSDataToCardData(fsrsData),
    };

    const newCard = (
      await db.insert(cardsTable).values(cardData).returning()
    )[0];

    await updatePageForCard({
      apiKey: chat.notion_api_key!,
      pageId,
      card: newCard,
    });

    return reply.send({ success: true });
  });
}
