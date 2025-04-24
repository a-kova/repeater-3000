import { cardExists, createCardForChat } from '../../../repositories/card.js';
import { getChatById } from '../../../repositories/chat.js';
import { NotionClient } from '../../notion.js';

export default async function addWord(chatId: number, word: string) {
  if (word.length < 3) {
    return 'The word must be at least 3 characters long.';
  }

  try {
    const chat = await getChatById(chatId);

    const exists = await cardExists({ word, chat_id: chatId });

    if (exists) {
      return 'This word already exists in your list.';
    }

    const card = await createCardForChat({ word }, chat!);

    if (chat?.notion_api_key && chat.notion_database_id) {
      const notion = new NotionClient(
        chat.notion_api_key,
        chat.notion_database_id
      );

      notion.createPageForCard(card).catch((error) => {
        console.error('Error creating page in Notion:', error);
      });
    }

    let message = `The word "${word}" has been added!`;

    if (card.translation) {
      message += `\n\n<b>Translation:</b> ${card.translation}`;
    }

    if (card.example) {
      message += `\n\n<b>Example:</b> ${card.example}`;
    }

    return message;
  } catch (error) {
    console.error('Error adding word:', error);
    return 'An error occurred while adding the word. Please try again.';
  }
}
