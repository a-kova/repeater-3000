import { Client } from '@notionhq/client';
import { cardsTable } from './db/schema.js';

type Args = {
  card: typeof cardsTable.$inferSelect;
  apiKey: string;
  databaseId: string;
};

export async function createPageForCard({ card, apiKey, databaseId }: Args) {
  const client = new Client({ auth: apiKey });

  const response = await client.pages.create({
    parent: {
      database_id: databaseId,
    },
    properties: {
      Word: {
        title: [
          {
            text: {
              content: card.word,
            },
          },
        ],
      },
      Meaning: {
        rich_text: [
          {
            text: {
              content: card.meaning || '',
            },
          },
        ],
      },
      Example: {
        rich_text: [
          {
            text: {
              content: card.example || '',
            },
          },
        ],
      },
    },
  });

  return response;
}

export async function findPageForCard({ card, apiKey, databaseId }: Args) {
  const client = new Client({ auth: apiKey });

  const response = await client.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Word',
      rich_text: {
        equals: card.word,
      },
    },
  });

  if (response.results.length > 0) {
    return response.results[0];
  }

  return null;
}

export async function updatePageForCard(args: Args) {
  const page = await findPageForCard(args);

  if (!page) {
    return await createPageForCard(args);
  }

  const client = new Client({ auth: args.apiKey });

  return await client.pages.update({
    page_id: page.id,
    properties: {
      Meaning: {
        rich_text: [
          {
            text: {
              content: args.card.meaning || '',
            },
          },
        ],
      },
      Example: {
        rich_text: [
          {
            text: {
              content: args.card.example || '',
            },
          },
        ],
      },
    },
  });
}

export async function deletePageForCard(args: Args) {
  const page = await findPageForCard(args);

  if (!page) {
    return null;
  }

  const client = new Client({ auth: args.apiKey });

  return await client.pages.update({
    page_id: page.id,
    archived: true,
  });
}
