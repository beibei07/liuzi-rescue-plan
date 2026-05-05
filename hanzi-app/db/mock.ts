/**
 * In-memory mock for web preview.
 * Mirrors the same async API as the real SQLite layer so useSRS works unchanged.
 */
import { type CharCard, type CardStats, type UserRating } from './srs';

const SEED: Omit<CharCard, 'id'>[] = [
  { character: '的', pinyin: 'de',    definition: null, level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '是', pinyin: 'shì',   definition: null, level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '在', pinyin: 'zài',   definition: null, level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '了', pinyin: 'le',    definition: null, level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '不', pinyin: 'bù',    definition: null, level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '人', pinyin: 'rén',   definition: null, level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '我', pinyin: 'wǒ',    definition: null, level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '有', pinyin: 'yǒu',   definition: null, level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '他', pinyin: 'tā',    definition: null, level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '这', pinyin: 'zhè',   definition: null, level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '中', pinyin: 'zhōng', definition: null, level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '大', pinyin: 'dà',    definition: null, level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '来', pinyin: 'lái',   definition: null, level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '上', pinyin: 'shàng', definition: null, level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '国', pinyin: 'guó',   definition: null, level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '到', pinyin: 'dào',   definition: null, level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '说', pinyin: 'shuō',  definition: null, level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '们', pinyin: 'men',   definition: null, level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '日', pinyin: 'rì',    definition: null, level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '字', pinyin: 'zì',    definition: null, level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
];

// Assign IDs and set due = now so all cards are immediately due
function buildQueue(): CharCard[] {
  const now = Date.now();
  return SEED.map((s, i) => ({ ...s, id: i + 1, due: now }));
}

let queue: CharCard[] = buildQueue();
let masteredCount = 0;

export function resetMock(): void {
  queue = buildQueue();
  masteredCount = 0;
}

export async function mockGetDueCards(limit: number): Promise<CharCard[]> {
  return queue.slice(0, limit);
}

export async function mockRateCard(cardId: number, rating: UserRating): Promise<void> {
  const idx = queue.findIndex(c => c.id === cardId);
  if (idx === -1) return;

  const card = { ...queue[idx], reps: queue[idx].reps + 1 };

  if (rating === 1) {
    // Again → move to end of queue (relearn soon)
    queue = [...queue.slice(0, idx), ...queue.slice(idx + 1), card];
  } else if (rating === 2) {
    // Hard → move 3 positions back
    queue.splice(idx, 1);
    queue.splice(Math.min(idx + 3, queue.length), 0, card);
  } else {
    // Good → remove from today's queue (scheduled for future)
    queue.splice(idx, 1);
    masteredCount += card.reps >= 3 ? 1 : 0;
  }
}

export async function mockGetCardStats(): Promise<CardStats> {
  return {
    total: SEED.length,
    due: queue.length,
    new: queue.filter(c => c.reps === 0).length,
    mastered: masteredCount,
  };
}
