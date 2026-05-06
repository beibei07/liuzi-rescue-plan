import { createEmptyCard, fsrs, Rating, type Card, type Grade, type State } from 'ts-fsrs';
import { getDatabase } from './db';

const f = fsrs();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CharCard {
  id: number;
  character: string;
  pinyin: string | null;
  definition: string | null;
  level: number;
  due: number;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  learning_steps: number;
  state: number;
  last_review: number | null;
}

export interface CardStats {
  total: number;
  due: number;
  new: number;
  mastered: number;
}

/** 1 = Again, 2 = Hard, 3 = Good */
export type UserRating = 1 | 2 | 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rowToFSRSCard(row: CharCard): Card {
  return {
    due: new Date(row.due),
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: row.elapsed_days,
    scheduled_days: row.scheduled_days,
    reps: row.reps,
    lapses: row.lapses,
    learning_steps: row.learning_steps,
    state: row.state as State,
    last_review: row.last_review ? new Date(row.last_review) : undefined,
  };
}

const RATING_MAP: Record<UserRating, Grade> = {
  1: Rating.Again,
  2: Rating.Hard,
  3: Rating.Good,
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Insert a blank SRS card for a new character.
 * No-op if the character already exists (INSERT OR IGNORE).
 */
export async function initCard(character: string): Promise<void> {
  const db = await getDatabase();
  const card = createEmptyCard();
  await db.runAsync(
    `INSERT OR IGNORE INTO char_cards
       (character, due, stability, difficulty, elapsed_days, scheduled_days,
        reps, lapses, learning_steps, state)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      character,
      card.due.getTime(),
      card.stability,
      card.difficulty,
      card.elapsed_days,
      card.scheduled_days,
      card.reps,
      card.lapses,
      card.learning_steps,
      card.state,
    ]
  );
}

/**
 * Return up to `limit` cards whose due timestamp is <= now, oldest first.
 */
export async function getDueCards(limit: number = 20): Promise<CharCard[]> {
  const db = await getDatabase();
  return db.getAllAsync<CharCard>(
    `SELECT * FROM char_cards WHERE due <= ? ORDER BY due ASC LIMIT ?`,
    [Date.now(), limit]
  );
}

/**
 * Apply a user rating (1/2/3) to a card, compute the next schedule via
 * FSRS, and persist the updated fields.
 */
export async function rateCard(cardId: number, rating: UserRating): Promise<void> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CharCard>(
    `SELECT * FROM char_cards WHERE id = ?`,
    [cardId]
  );
  if (!row) throw new Error(`Card id=${cardId} not found`);

  const now = new Date();
  const scheduling = f.repeat(rowToFSRSCard(row), now);
  const next = scheduling[RATING_MAP[rating]].card;

  await db.runAsync(
    `UPDATE char_cards SET
       due = ?, stability = ?, difficulty = ?, elapsed_days = ?,
       scheduled_days = ?, reps = ?, lapses = ?, learning_steps = ?,
       state = ?, last_review = ?
     WHERE id = ?`,
    [
      next.due.getTime(),
      next.stability,
      next.difficulty,
      next.elapsed_days,
      next.scheduled_days,
      next.reps,
      next.lapses,
      next.learning_steps,
      next.state,
      next.last_review?.getTime() ?? null,
      cardId,
    ]
  );
}

/**
 * Aggregate stats across all char_cards.
 * "mastered" = state=Review AND stability >= 21 days.
 */
export async function getCardStats(): Promise<CardStats> {
  const db = await getDatabase();
  const now = Date.now();

  const [totalRow, dueRow, newRow, masteredRow] = await Promise.all([
    db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM char_cards`),
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM char_cards WHERE due <= ?`, [now]
    ),
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM char_cards WHERE state = 0`
    ),
    db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM char_cards WHERE state = 2 AND stability >= 21`
    ),
  ]);

  return {
    total:    totalRow?.count    ?? 0,
    due:      dueRow?.count      ?? 0,
    new:      newRow?.count      ?? 0,
    mastered: masteredRow?.count ?? 0,
  };
}

/** Fetch a single card by primary key. Returns null if not found. */
export async function getCard(id: number): Promise<CharCard | null> {
  const db = await getDatabase();
  return db.getFirstAsync<CharCard>(
    `SELECT * FROM char_cards WHERE id = ?`, [id]
  );
}
