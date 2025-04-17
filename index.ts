import fastify from 'fastify';
import { attachTelegrafToServer } from './services/telegram';

const server = fastify({
  logger: true,
});

(async function () {
  await attachTelegrafToServer(server);

  server.get('/health', async () => {
    return { status: 'ok' };
  });

  // server.get('/api/send-words', async () => {
  //   const cards = await db.query.cardsTable.findMany({
  //     where: (table, { gte }) => gte(table.due, new Date()),
  //   });

  //   if (!page) {
  //     return { message: 'No words found for today.' };
  //   }

  //   return { word: page.Word };
  // });

  server.listen({ port: 8080 }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    console.log(`Server listening at ${address}`);
  });
})();
