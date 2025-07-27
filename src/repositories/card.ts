import { and, desc, eq, sql, InferInsertModel } from 'drizzle-orm';
import { Rating, createEmptyCard, fsrs, generatorParameters } from 'ts-fsrs';
import { cardsTable, db } from '../services/db/index.js';
import {
  getRussianTranslationForWord,
  getRussianTranslationForSentence,
  getUsageExampleForWord,
} from '../services/openai.js';
import {
  getFSRSDataFromCardData,
  convertFSRSDataToCardData,
} from '../helpers/index.js';
import type { Card, Chat } from '../types.js';

//type CardInsertData = InferInsertModel<typeof cardsTable>;
type CardInsertData = any;

const f = fsrs(
  generatorParameters({
    enable_fuzz: true,
    enable_short_term: false,
  })
);

async function populatePaidData(data: CardInsertData): Promise<CardInsertData> {
  const existingCard = await db.query.cardsTable.findFirst({
    where: (table, { and, eq, isNotNull }) =>
      and(
        eq(table.word, data.word),
        isNotNull(table.translation),
        isNotNull(table.example)
      ),
    columns: { translation: true, example: true },
  });

  if (existingCard) {
    return { ...data, ...existingCard };
  }

  const [translation, example] = await Promise.all([
    getRussianTranslationForWord(data.word),
    getUsageExampleForWord(data.word),
  ]);

  const example_translation = await getRussianTranslationForSentence(example!);

  return { ...data, translation, example, example_translation };
}

export async function getAllCardsForChat(chatId: number) {
  return await db.query.cardsTable.findMany({
    where: (table, { eq }) => eq(table.chat_id, chatId),
    orderBy: (table) => table.word,
    limit: 100,
  });
}

export async function cardExists(data: Pick<Card, 'word' | 'chat_id'>) {
  const card = await db.query.cardsTable.findFirst({
    where: (table, { and, eq }) =>
      and(eq(table.word, data.word), eq(table.chat_id, data.chat_id)),
    columns: { id: true },
  });

  return !!card;
}

export async function createCardForChat(
  data: Partial<CardInsertData>,
  chat: Chat
) {
  const fsrsData = createEmptyCard(new Date());

  let insertData: typeof cardsTable.$inferInsert = {
    ...data,
    ...fsrsData,
    word: data.word || '',
    stability: fsrsData.stability.toString(),
    difficulty: fsrsData.difficulty.toString(),
    last_review: fsrsData.last_review || null,
    chat_id: chat.id,
  };

  if (chat.is_paid) {
    insertData = await populatePaidData(insertData);
  }

  const res = await db.insert(cardsTable).values(insertData).returning();

  return res[0];
}

export async function rateCard(card: Card, rating: Rating) {
  let { id, ...newCardData } = card;

  const previews = f.repeat(getFSRSDataFromCardData(card), new Date());

  for (const preview of previews) {
    if (preview.log.rating === rating) {
      newCardData = {
        ...newCardData,
        ...convertFSRSDataToCardData(preview.card),
      };
    }
  }

  await db.update(cardsTable).set(newCardData).where(eq(cardsTable.id, id));
}

export async function deleteCard(params: Pick<Card, 'word' | 'chat_id'>) {
  return await db
    .delete(cardsTable)
    .where(
      and(
        eq(cardsTable.chat_id, params.chat_id),
        eq(cardsTable.word, params.word)
      )
    );
}

export async function getCardsForToday(chatId: number) {
  const endOfToday = new Date();
  endOfToday.setUTCHours(23, 59, 59, 999);

  return await db.query.cardsTable.findMany({
    where: (table, { and, eq, lte }) =>
      and(eq(table.chat_id, chatId), lte(table.due, endOfToday)),
    limit: 20,
    orderBy: sql`RANDOM()`,
  });
}

export async function getCardForToday(chatId: number) {
  const endOfToday = new Date();
  endOfToday.setUTCHours(23, 59, 59, 999);

  return await db.query.cardsTable.findFirst({
    where: (table, { and, eq, lte }) =>
      and(eq(table.chat_id, chatId), lte(table.due, endOfToday)),
  });
}

export async function getRandomCards(options: {
  chatId: number;
  except: string;
  limit?: number;
}): Promise<Card[]> {
  const { chatId, except, limit = 3 } = options;

  return await db.query.cardsTable.findMany({
    where: (table, { and, eq, ne }) =>
      and(eq(table.chat_id, chatId), ne(table.word, except)),
    orderBy: sql`random()`,
    limit,
  });
}

export async function getHardestCards(chatId: number, limit = 10) {
  return await db.query.cardsTable.findMany({
    where: (table, { and, eq, gt }) =>
      and(eq(table.chat_id, chatId), gt(table.reps, 5)),
    orderBy: (table) => [desc(table.difficulty)],
    limit,
  });
}
