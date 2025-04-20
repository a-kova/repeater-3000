import { Client } from '@notionhq/client';
import { cardsTable } from './db/schema.js';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints.js';

export type PageData = {
  id: string;
  word: string;
  meaning: string;
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

  async getAllPagesFromDbEditedAfter(since: Date): Promise<PageData[]> {
    const response = await this.client.databases.query({
      database_id: this.databaseId,
      filter: {
        // select the page’s creation timestamp
        timestamp: 'last_edited_time',
        last_edited_time: {
          on_or_after: since.toISOString(),
        },
      },
    });

    return (response.results as PageObjectResponse[]).map((page) => {
      const properties = page.properties as any;

      return {
        id: page.id,
        word: properties.Word.title[0].text.content,
        meaning: properties.Meaning.rich_text[0]?.text.content || '',
        example: properties.Example.rich_text[0]?.text.content || '',
        archived: page.archived,
      };
    });
  }

  async updatePageForCard(
    pageId: string,
    card: typeof cardsTable.$inferSelect
  ) {
    return await this.client.pages.update({
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
}
