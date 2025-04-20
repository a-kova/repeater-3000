import fastify from 'fastify';
import { attachTelegrafToServer } from './services/telegram/index.js';
import { cardsTable, db } from './services/db/index.js';
import { createNewFSRSData } from './services/fsrs.js';
import { startCronJobs } from './services/cron.js';
import { convertFSRSDataToCardData } from './helpers/index.js';
import { and, eq } from 'drizzle-orm';
import { getMeaningOfWord, getUsageExampleForWord } from './services/openai.js';
import { console } from 'inspector';

const server = fastify({
  logger: true,
});

async function run() {
  await attachTelegrafToServer(server);

  server.get('/health', async (_req, reply) => {
    reply.send({ status: 'ok' });
  });

  server.get('/api/notion', async (req, reply) => {
    // Log all params
    console.log(req.query);
    console.log(req.body);
    console.log(req.params);

    reply.status(200).send({ message: 'Notion API endpoint' });
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
