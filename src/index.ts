import fastify from 'fastify';
import { attachTelegrafToServer } from './services/telegram/index.js';
import { startCronJobs } from './services/cron.js';
import notionRoutes from './routes/notion.js';

const server = fastify({
  logger: true,
});

async function run() {
  await attachTelegrafToServer(server);

  server.get('/health', async (_req, reply) => {
    reply.send({ status: 'ok' });
  });

  notionRoutes(server);

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
