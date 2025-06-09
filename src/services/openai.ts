import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getRussianTranslationForWord(
  word: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are a strict bilingual dictionary. Only return direct, most common Russian translations for English words, not synonyms or stylistic variants.',
      },
      {
        role: 'user',
        content: `Translate the English word "${word}" to Russian. Only return the most common Russian equivalents (no synonyms or variations). Limit to 2–3 words maximum. Respond in JSON format using the return_translations tool.`,
      },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'return_translations',
          description:
            'Returns possible Russian translations for a given English word.',
          parameters: {
            type: 'object',
            properties: {
              translations: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: ['translations'],
          },
        },
      },
    ],
    tool_choice: {
      type: 'function',
      function: { name: 'return_translations' },
    },
  });

  const toolCall = response.choices[0].message.tool_calls?.[0];
  if (!toolCall || toolCall.function.name !== 'return_translations') {
    throw new Error('Unexpected tool call format');
  }

  const args = JSON.parse(toolCall.function.arguments);
  return (args.translations as string[]).join(', ');
}

export async function getRussianTranslationForSentence(
  sentence: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are a strict bilingual dictionary. Only return direct, most common Russian translation for English sentence, not synonyms or stylistic variants.',
      },
      {
        role: 'user',
        content: `Translate the English sentence "${sentence}" to Russian. Only return the most common Russian equivalents (no synonyms or variations). Respond in JSON format using the return_translations tool.`,
      },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'return_translation',
          description:
            'Returns the Russian translation for a given English sentence.',
          parameters: {
            type: 'object',
            properties: {
              translation: {
                type: 'string',
                description: 'The Russian translation of the English sentence.',
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

  if (!toolCall || toolCall.function.name !== 'return_translation') {
    throw new Error('Unexpected tool call format');
  }

  return JSON.parse(toolCall.function.arguments);
}

export async function getUsageExampleForWord(word: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are an assistant that provides short example sentences using English words.',
      },
      {
        role: 'user',
        content: `Give one clear, natural usage example of the word "${word}" in a sentence. Do not include any explanation.`,
      },
    ],
    temperature: 0.3,
  });

  return response.choices[0].message.content?.trim();
}
