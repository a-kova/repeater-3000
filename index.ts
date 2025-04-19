import fastify from 'fastify';
import { attachTelegrafToServer } from './services/telegram/index.js';
import { cardsTable, db } from './services/db/index.js';
import { createNewFSRSData } from './services/fsrs.js';
import { startCronJobs } from './services/cron.js';
import { convertFSRSDataToCardData } from './helpers/index.js';
import { and, eq } from 'drizzle-orm';

const server = fastify({
  logger: process.env.NODE_ENV !== 'production',
});

async function run() {
  await attachTelegrafToServer(server);

  server.get('/health', async (_req, reply) => {
    reply.send({ status: 'ok' });
  });

  server.post<{
    Body: { chat_id: number; word: string; meaning?: string; example?: string };
  }>('/api/words', async (req, reply) => {
    const chat = await db.query.chatsTable.findFirst({
      where: (table, { eq }) => eq(table.id, req.body.chat_id),
    });

    if (!chat || !chat.is_paid) {
      reply.status(403).send({ error: 'Not authorized' });
      return;
    }

    await db.insert(cardsTable).values({
      ...req.body,
      ...convertFSRSDataToCardData(createNewFSRSData()),
    });

    reply.status(201).send({ message: 'Word added successfully' });
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

  server.listen({ port: 8080 }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.log(`Server listening at ${address}`);
  });

  startCronJobs();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
