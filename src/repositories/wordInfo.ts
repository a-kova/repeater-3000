import { and, eq, InferInsertModel } from 'drizzle-orm';
import { wordsInfoTable, db } from '../services/db/index.js';
import { getWordInfo as getWordInfoFromAI } from '../services/openai.js';

type WordInfoInsertData = InferInsertModel<typeof wordsInfoTable>;

export async function createWordInfo(data: WordInfoInsertData) {
  const res = await db
    .insert(wordsInfoTable)
    .values(data)
    .onConflictDoUpdate({ target: wordsInfoTable.id, set: data })
    .returning();

  return res[0];
}

export async function getWordInfo(word: string, originalLanguage: string) {
  const res = await db
    .select()
    .from(wordsInfoTable)
    .where(
      and(
        eq(wordsInfoTable.word, word),
        eq(wordsInfoTable.original_language, originalLanguage)
      )
    )
    .execute();

  return res[0];
}

export async function getWordInfoById(id: number) {
  const res = await db
    .select()
    .from(wordsInfoTable)
    .where(eq(wordsInfoTable.id, id))
    .execute();

  return res[0];
}

export async function getOrCreateWordInfo(
  word: string,
  originalLanguage: string
) {
  let wordInfo = await getWordInfo(word, originalLanguage);

  if (!wordInfo) {
    const wordInfoData = await getWordInfoFromAI(word, originalLanguage);

    wordInfo = await createWordInfo({
      word,
      original_language: originalLanguage,
      translation: wordInfoData.translations.join(', '),
      base_form: wordInfoData.base_form,
      example: wordInfoData.example,
      importance: wordInfoData.importance,
    });
  }

  return wordInfo;
}
