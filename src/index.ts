import fastify from 'fastify';
import { attachTelegrafToServer } from './services/telegram/index.js';
import { cardsTable, db } from './services/db/index.js';
import { createNewFSRSData } from './services/fsrs.js';
import { startCronJobs } from './services/cron.js';
import { convertFSRSDataToCardData } from './helpers/index.js';
import { and, eq } from 'drizzle-orm';
import { getMeaningOfWord, getUsageExampleForWord } from './services/openai.js';

const server = fastify({
  logger: true,
});

async function run() {
  await attachTelegrafToServer(server);

  server.get('/health', async (_req, reply) => {
    reply.send({ status: 'ok' });
  });

  server.post<{
    Body: { chat_id: number; word: string };
  }>('/api/words', async (req, reply) => {
    const chat = await db.query.chatsTable.findFirst({
      where: (table, { eq }) => eq(table.id, req.body.chat_id),
    });

    if (!chat || !chat.is_paid) {
      reply.status(403).send({ error: 'Not authorized' });
      return;
    }

    const [meaning, example] = await Promise.all([
      getMeaningOfWord(req.body.word),
      getUsageExampleForWord(req.body.word),
    ]);

    const card = (
      await db
        .insert(cardsTable)
        .values({
          ...req.body,
          ...convertFSRSDataToCardData(createNewFSRSData()),
          meaning,
          example,
        })
        .returning()
    )[0];

    reply.status(201).send(card);
  });

  server.delete<{
    Body: { chat_id: number; word: string };
  }>('/api/words', async (req, reply) => {
    const chat = await db.query.chatsTable.findFirst({
      where: (table, { eq }) => eq(table.id, req.body.chat_id),
    });

    if (!chat || !chat.is_paid) {
      reply.status(403).send({ error: 'Not authorized' });
      return;
    }

    await db
      .delete(cardsTable)
      .where(
        and(
          eq(cardsTable.chat_id, req.body.chat_id),
          eq(cardsTable.word, req.body.word)
        )
      );

    reply.status(200).send({ message: 'Word deleted successfully' });
  });

  server.listen(
    { port: process.env.PORT || 8080, host: '0.0.0.0' },
    (err, address) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }

      console.log(`Server listening at ${address}`);
    }
  );

  startCronJobs();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
