import { Client } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints.js';
import type { Card } from '../types.js';

export type PageData = {
  id: string;
  word: string;
  translation: string;
  example: string;
  difficulty: number;
  stability: number;
};

export class NotionClient {
  private client: Client;

  private databaseId: string;

  constructor(apiKey: string, databaseId: string) {
    this.client = new Client({ auth: apiKey });
    this.databaseId = databaseId;
  }

  async findPageForWord(word: string): Promise<PageData | null> {
    const response = await this.client.databases.query({
      database_id: this.databaseId,
      filter: {
        property: 'Word',
        rich_text: {
          equals: word,
        },
      },
    });

    if (response.results.length === 0) {
      return null;
    }

    const page = response.results[0] as PageObjectResponse;
    const properties = page.properties as any;

    return {
      id: page.id,
      word: word,
      translation: properties.Translation.rich_text[0]?.text.content || '',
      example: properties.Example.rich_text[0]?.text.content || '',
      difficulty: properties.Difficulty.number || 0,
      stability: properties.Stability.number || 0,
    };
  }

  async createPageForCard(card: Card) {
    return await this.client.pages.create({
      parent: {
        database_id: this.databaseId,
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
        Difficulty: {
          number: parseFloat(card.difficulty || '0'),
        },
        Stability: {
          number: parseFloat(card.stability || '0'),
        },
      },
    });
  }

  async deletePageForWord(word: string) {
    const page = await this.findPageForWord(word);

    if (!page) {
      return null;
    }

    return await this.client.pages.update({
      page_id: page.id,
      archived: true,
    });
  }
}
