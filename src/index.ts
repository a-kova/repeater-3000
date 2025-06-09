import fastify from 'fastify';
import { attachTelegrafToServer } from './services/telegram/index.js';
import { getRussianTranslationForSentence } from './services/openai.js';
import { startCronJobs } from './services/cron.js';
import { cardsTable, db } from './services/db/index.js';
import { eq } from 'drizzle-orm';

const server = fastify({
  logger: true,
});

async function run() {
  if (process.env.NODE_ENV === 'production') {
    await attachTelegrafToServer(server);
  }

  server.get('/health', async (_req, reply) => {
    reply.send({ status: 'ok' });
  });

  server.get('/update-translations', async (_req, reply) => {
    const cards = await db.query.cardsTable.findMany({
      where: (table, { isNull }) => isNull(table.translation),
    });

    cards.forEach(async (card) => {
      const translation = await getRussianTranslationForSentence(card.word);

      await db
        .update(cardsTable)
        .set({ translation })
        .where(eq(cardsTable.id, card.id));
    });

    reply.send({
      status: `Updated ${cards.length} cards without translations`,
    });
  });

  server.listen(
    { port: process.env.PORT || 8080, host: '0.0.0.0' },
    (err, address) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }

      startCronJobs();

      console.log(`Server listening at ${address}`);
    }
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
