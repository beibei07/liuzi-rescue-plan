import { getDatabase } from './db';
import hsk500 from '../data/hsk_500.json';
import { createEmptyCard } from 'ts-fsrs';

/**
 * Seed char_cards from hsk_500.json.
 * Uses INSERT OR IGNORE so existing cards are never overwritten.
 */
export async function seedHSKCharacters(): Promise<void> {
  const db = await getDatabase();
  const card = createEmptyCard();
  const due = card.due.getTime();

  for (const entry of hsk500.characters) {
    await db.runAsync(
      `INSERT OR IGNORE INTO char_cards
         (character, pinyin, level, due, stability, difficulty, elapsed_days,
          scheduled_days, reps, lapses, learning_steps, state)
       VALUES (?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0)`,
      [entry.character, entry.pinyin, entry.level, due]
    );
  }
}
