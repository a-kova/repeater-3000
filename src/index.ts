import fastify from 'fastify';
import { attachTelegrafToServer } from './services/telegram/index.js';
import { startCronJobs } from './services/cron.js';

const server = fastify({
  logger: true,
});

async function run() {
  await attachTelegrafToServer(server);

  server.get('/health', async (_req, reply) => {
    reply.send({ status: 'ok' });
  });

  server.post('/api/notion', async (req, reply) => {
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
