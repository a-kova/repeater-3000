import fastify from 'fastify';
import { bot } from './services/telegram/index.js';
import { startCronJobs } from './services/cron.js';

const server = fastify({
  logger: true,
});

async function run() {
  if (process.env.NODE_ENV === 'production') {
    const webhook = await bot.createWebhook({ domain: process.env.HOST });
    console.log('Webhook created');

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

  server.get('/', async (_req, reply) => {
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
