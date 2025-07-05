import fastify from 'fastify';
import { bot } from './services/telegram/index.js';
import { startCronJobs } from './services/cron.js';
import { getAllCardsForChat } from './repositories/card.js';
import { cardsTable, db } from './services/db/index.js';
import { getRussianTranslationForSentence } from './services/openai.js';
import { eq } from 'drizzle-orm';

const server = fastify({
  logger: true,
});

async function run() {
  if (process.env.NODE_ENV === 'production') {
    const webhook = await bot.createWebhook({ domain: process.env.HOST });

    server.post(
      `/telegraf/${bot.secretPathComponent()}`,
      async (req, reply) => {
        reply.hijack();
        // @ts-expect-error: req.raw is not a standard property
        req.raw.body = req.body;
        await webhook(req.raw, reply.raw);
      }
    );
  }

  server.get('/health', async (_req, reply) => {
    reply.send({ status: 'ok' });
  });

  server.get('/fix', async (_req, reply) => {
    const cards = await db.query.cardsTable.findMany({
      where: (table, { isNotNull }) => isNotNull(table.example),
    });

    const promises = cards.map(async (card) => {
      const example_translation = await getRussianTranslationForSentence(
        card.example!
      );
      return db
        .update(cardsTable)
        .set({
          example_translation,
        })
        .where(eq(cardsTable.id, card.id));
    });

    await Promise.all(promises);

    reply.send({ status: 'ok', message: 'Translations updated successfully' });
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
