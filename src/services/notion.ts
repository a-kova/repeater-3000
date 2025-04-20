import { Client } from '@notionhq/client';
import { cardsTable } from './db/schema.js';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints.js';

export async function getPageById(apiKey: string, pageId: string) {
  const client = new Client({ auth: apiKey });

  const response = await client.pages.retrieve({
    page_id: pageId,
  });

  return response as PageObjectResponse;
}

export async function updatePageForCard({
  apiKey,
  pageId,
  card,
}: {
  apiKey: string;
  pageId: string;
  card: typeof cardsTable.$inferSelect;
}) {
  const client = new Client({ auth: apiKey });

  return await client.pages.update({
    page_id: pageId,
    properties: {
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
}
