import { eq, InferInsertModel } from 'drizzle-orm';
import { chatsTable, db } from '../services/db/index.js';

type ChatInsertData = InferInsertModel<typeof chatsTable>;

export async function getChatById(chatId: number) {
  const chat = await db.query.chatsTable.findFirst({
    where: (table, { eq }) => eq(table.id, chatId),
  });

  if (!chat) {
    throw new Error('Chat not found. Try running /start command');
  }

  return chat;
}

export async function createChat(data: ChatInsertData) {
  const res = await db
    .insert(chatsTable)
    .values(data)
    .onConflictDoUpdate({ target: chatsTable.id, set: data })
    .returning();

  return res[0];
}

export async function updateChat(
  chatId: number,
  data: Partial<ChatInsertData>
) {
  const res = await db
    .update(chatsTable)
    .set(data)
    .where(eq(chatsTable.id, chatId))
    .returning();

  return res[0];
}

export async function deleteChat(chatId: number) {
  return await db.delete(chatsTable).where(eq(chatsTable.id, chatId));
}
