import { OpenAI } from 'openai';
import { isValidTimeZone } from '../helpers/index.js';

type WordInfo = {
  base_form: string;
  importance: number;
  translations: string[];
  example: string;
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const nanoModel = 'gpt-5-nano';
const miniModel = 'gpt-5-mini';

export async function getTimezoneForCity(city: string) {
  const response = await openai.chat.completions.create({
    model: nanoModel,
    messages: [
      {
        role: 'system',
        content:
          'You are an assistant that provides accurate timezone information based on city names. You have access to a comprehensive database of world cities and their corresponding timezones.',
      },
      {
        role: 'user',
        content: `What is the IANA timezone for the city "${city}"? If the city name is ambiguous, provide the timezone for the most well-known city with that name. If the city cannot be found, respond with "Unknown".`,
      },
    ],
  });

  const timezone = response.choices[0].message.content?.trim();

  if (!timezone || !isValidTimeZone(timezone)) {
    throw new Error('Something went wrong');
  }

  return timezone;
}

export async function getTranslationForSentence(
  sentence: string,
  targetLanguage = 'ru'
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: nanoModel,
    messages: [
      {
        role: 'system',
        content:
          'You are a strict bilingual dictionary. Only return direct, most common translations for English sentences, no synonyms or stylistic variants.',
      },
      {
        role: 'user',
        content: `Translate the English sentence "${sentence}" to ${targetLanguage} language. Respond in JSON format using the return_translations tool.`,
      },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'return_translation',
          description: 'Returns the translation for a given English sentence.',
          parameters: {
            type: 'object',
            properties: {
              translation: {
                type: 'string',
                description: 'The translation of the English sentence.',
              },
            },
            required: ['translation'],
          },
        },
      },
    ],
    tool_choice: {
      type: 'function',
      function: { name: 'return_translation' },
    },
  });

  const toolCall = response.choices[0].message.tool_calls?.[0];

  if (
    !toolCall ||
    toolCall.type !== 'function' ||
    toolCall.function.name !== 'return_translation'
  ) {
    throw new Error('Unexpected tool call format');
  }

  return JSON.parse(toolCall.function.arguments).translation;
}

export async function createSentenceWithEmptySpace(
  word: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: miniModel,
    messages: [
      {
        role: 'system',
        content:
          'You are an assistant that creates educational fill-in-the-blank sentences. Create clear, natural sentences that provide enough context to guess the missing word.',
      },
      {
        role: 'user',
        content: `Create a sentence where the word "${word}" is replaced with "___" (three underscores). The sentence should be clear, grammatically correct, and provide sufficient context for someone to deduce the missing word. Use the word in its most common meaning and typical context.`,
      },
    ],
  });

  const result = response.choices[0].message.content?.trim();

  if (!result) {
    throw new Error('Something went wrong');
  }

  return result;
}

export async function checkWordUsageInSentence(
  word: string,
  sentence: string,
  commentLanguage: string = 'en'
): Promise<{ isCorrect: boolean; comment: string }> {
  const response = await openai.chat.completions.create({
    model: miniModel,
    messages: [
      {
        role: 'system',
        content:
          'You are an English language expert. Determine if a word is used correctly in a sentence.',
      },
      {
        role: 'user',
        content: `Is the word "${word}" used correctly in the sentence "${sentence}"?`,
      },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'check_usage',
          description: 'Checks if a word is used correctly in a sentence.',
          parameters: {
            type: 'object',
            properties: {
              is_correct: {
                type: 'boolean',
                description:
                  'True if the word is used correctly, false otherwise.',
              },
              comment: {
                type: 'string',
                description: `A short comment with feedback in ${commentLanguage} language`,
              },
            },
            required: ['is_correct', 'comment'],
          },
        },
      },
    ],
  });

  const toolCall = response.choices[0].message.tool_calls?.[0];

  if (
    !toolCall ||
    toolCall.type !== 'function' ||
    toolCall.function.name !== 'check_usage'
  ) {
    throw new Error('Unexpected tool call format');
  }

  const args = JSON.parse(toolCall.function.arguments);

  return {
    isCorrect: args.is_correct,
    comment: args.comment,
  };
}

export async function checkTranslation(
  word: string,
  translation: string
): Promise<boolean> {
  const response = await openai.chat.completions.create({
    model: nanoModel,
    messages: [
      {
        role: 'system',
        content:
          'You are an English language expert. Determine if a translation conveys the correct general meaning. Be lenient — accept translations that are close in meaning, even if not exact. Ignore tense, grammatical form, typos, or word-for-word match. Focus on whether the meaning is preserved in typical use.',
      },
      {
        role: 'user',
        content: `Does "${translation}" convey the general meaning of "${word}"? Respond with "yes" or "no", accepting near-synonyms and contextually accurate translations.`,
      },
    ],
  });

  const answer = response.choices[0].message.content?.trim().toLowerCase();
  return answer?.includes('yes') ?? false;
}

export async function getWordInfo(word: string, translateTo: string) {
  const response = await openai.chat.completions.create({
    model: miniModel,
    messages: [
      {
        role: 'system',
        content:
          'You are an English language assistant. Provide comprehensive information about English words for language learning purposes.',
      },
      {
        role: 'user',
        content: `For the English word "${word}":
1. Determine its base/lemma form (add "a/an" for countable nouns, "to" for verbs)
2. Rate its learning importance (1-10, where 10 = essential daily vocabulary)
3. Provide 2-3 most common translations to ${translateTo}
4. Create a simple, clear usage example
Use the return_word_info tool to respond.`,
      },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'return_word_info',
          description:
            'Returns brief definition, common translations, and usage example for a given English word.',
          parameters: {
            type: 'object',
            properties: {
              base_form: {
                type: 'string',
                description:
                  'The base form of the word (lemma). Add article "a" or "an" if it is a noun and "to" if it is a verb.',
              },
              importance: {
                type: 'number',
                description:
                  'Learning priority from 1-10: 1-3=specialized/rare, 4-6=intermediate, 7-8=common, 9-10=essential daily vocabulary',
              },
              translations: {
                type: 'array',
                items: { type: 'string' },
                description: `Most common translations to ${translateTo} language (2-3 words maximum).`,
              },
              example: {
                type: 'string',
                description:
                  'A simple, clear sentence using the word in its most common meaning. Keep it under 15 words and use everyday language.',
              },
            },
            required: ['base_form', 'importance', 'translations', 'example'],
          },
        },
      },
    ],
    tool_choice: {
      type: 'function',
      function: { name: 'return_word_info' },
    },
  });

  const toolCall = response.choices[0].message.tool_calls?.[0];

  if (
    !toolCall ||
    toolCall.type !== 'function' ||
    toolCall.function.name !== 'return_word_info'
  ) {
    throw new Error('Unexpected tool call format');
  }

  return JSON.parse(toolCall.function.arguments) as WordInfo;
}
