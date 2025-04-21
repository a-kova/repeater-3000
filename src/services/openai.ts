import { ChatGPTAPI } from 'chatgpt';

const chatGPT = new ChatGPTAPI({ apiKey: process.env.OPENAI_API_KEY });

export async function getMeaningOfWord(word: string) {
  const response = await chatGPT.sendMessage(
    `Provide a simple, clear and straightforward definition for the word "${word}". Don't include original word in the definition.`
  );

  return response.text.trim();
}

export async function getUsageExampleForWord(word: string) {
  const response = await chatGPT.sendMessage(
    `Provide a short and simple sentence in English using the word "${word}".`
  );

  return response.text.trim();
}

export async function getRussianTranslationForWord(word: string) {
  const response = await chatGPT.sendMessage(
    `Translate the word "${word}" to Russian.`
  );

  return response.text.trim();
}
