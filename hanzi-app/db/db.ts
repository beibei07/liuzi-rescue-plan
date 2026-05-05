import * as SQLite from 'expo-sqlite';
import { CREATE_CHAR_CARDS, CREATE_QUOTES, CREATE_PRACTICE_LOG, CREATE_STREAK } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('hanzi.db');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(CREATE_CHAR_CARDS);
  await database.execAsync(CREATE_QUOTES);
  await database.execAsync(CREATE_PRACTICE_LOG);
  await database.execAsync(CREATE_STREAK);
}
