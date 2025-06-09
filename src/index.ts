import fastify from 'fastify';
import { attachTelegrafToServer } from './services/telegram/index.js';
import { startCronJobs } from './services/cron.js';

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
