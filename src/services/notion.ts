import { Client } from '@notionhq/client';
import { cardsTable } from './db/schema.js';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints.js';

export type PageData = {
  id: string;
  word: string;
  translation: string;
  example: string;
  archived: boolean;
};

export class NotionClient {
  private client: Client;

  private databaseId: string;

  constructor(apiKey: string, databaseId: string) {
    this.client = new Client({ auth: apiKey });
    this.databaseId = databaseId;
  }

  async getAllPagesFromDbEditedAfter(
    since: Date,
    nextCursor?: string
  ): Promise<{ items: PageData[]; nextCursor?: string }> {
    const response = await this.client.databases.query({
      database_id: this.databaseId,
      start_cursor: nextCursor || undefined,
      filter: {
        timestamp: 'last_edited_time',
        last_edited_time: {
          on_or_after: since.toISOString(),
        },
      },
    });

    return {
      items: (response.results as PageObjectResponse[]).map((page) => {
        const properties = page.properties as any;

        return {
          id: page.id,
          word: properties.Word.title[0].text.content,
          translation: properties.Translation.rich_text[0]?.text.content || '',
          example: properties.Example.rich_text[0]?.text.content || '',
          archived: page.archived,
        };
      }),
      nextCursor: response.next_cursor || undefined,
    };
  }

  async updatePageForCard(
    pageId: string,
    card: typeof cardsTable.$inferSelect
  ) {
    return await this.client.pages.update({
      page_id: pageId,
      properties: {
        Translation: {
          rich_text: [
            {
              text: {
                content: card.translation || '',
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
}
