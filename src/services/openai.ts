import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const model = 'gpt-5-nano';

export async function getRussianTranslationForWord(
  word: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model,
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

  if (
    !toolCall ||
    toolCall.type !== 'function' ||
    toolCall.function.name !== 'return_translations'
  ) {
    throw new Error('Unexpected tool call format');
  }

  const args = JSON.parse(toolCall.function.arguments);
  return (args.translations as string[]).join(', ');
}

export async function getRussianTranslationForSentence(
  sentence: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content:
          'You are a strict bilingual dictionary. Only return direct, most common Russian translation for English sentence, no synonyms or stylistic variants.',
      },
      {
        role: 'user',
        content: `Translate the English sentence "${sentence}" to Russian. Respond in JSON format using the return_translations tool.`,
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

  if (
    !toolCall ||
    toolCall.type !== 'function' ||
    toolCall.function.name !== 'return_translation'
  ) {
    throw new Error('Unexpected tool call format');
  }

  return JSON.parse(toolCall.function.arguments).translation;
}

export async function getUsageExampleForWord(word: string) {
  const response = await openai.chat.completions.create({
    model,
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
  });

  return response.choices[0].message.content?.trim();
}

export async function checkWordUsageInSentence(
  word: string,
  sentence: string
): Promise<{ isCorrect: boolean; comment: string }> {
  const response = await openai.chat.completions.create({
    model,
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
                description: 'A short comment with feedback.',
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
    model,
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
