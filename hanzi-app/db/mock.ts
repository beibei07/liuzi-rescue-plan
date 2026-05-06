/**
 * In-memory mock for web preview.
 * Mirrors the same async API as the real SQLite layer so useSRS works unchanged.
 */
import { type CharCard, type CardStats, type UserRating } from './srs';

const DEFINITIONS: Record<string, string> = {
  '的': JSON.stringify({ meaning: '结构助词', examples: ['今天的天气真好', '我的书包很重'],    words: ['的确', '目的', '的士'] }),
  '是': JSON.stringify({ meaning: '判断动词',   examples: ['这是一本好书', '他是我的老师'],  words: ['是否', '是非', '还是'] }),
  '在': JSON.stringify({ meaning: '表示位置',   examples: ['我在图书馆学习', '书在桌子上'],  words: ['在乎', '在意', '正在'] }),
  '了': JSON.stringify({ meaning: '表示完成',   examples: ['他走了很久', '我吃了一碗饭'],    words: ['了解', '了不起', '明了'] }),
  '不': JSON.stringify({ meaning: '否定副词',   examples: ['我不喜欢吃辣', '他不来上课'],    words: ['不但', '不过', '不知道'] }),
  '人': JSON.stringify({ meaning: '名词',       examples: ['路上人很多', '这个人很善良'],    words: ['人生', '人才', '人口'] }),
  '我': JSON.stringify({ meaning: '第一人称',   examples: ['我喜欢看书', '我的家在北京'],    words: ['我们', '自我', '忘我'] }),
  '有': JSON.stringify({ meaning: '表示拥有',   examples: ['他有一本书', '教室里有人'],      words: ['有趣', '有用', '有名'] }),
  '他': JSON.stringify({ meaning: '第三人称男', examples: ['他是我的朋友', '他很努力'],      words: ['他们', '他人', '其他'] }),
  '这': JSON.stringify({ meaning: '指示近处',   examples: ['这本书很好看', '这里风景很美'],  words: ['这里', '这样', '这么'] }),
};

const SEED: Omit<CharCard, 'id'>[] = [
  { character: '的', pinyin: 'de',    definition: DEFINITIONS['的'], level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '是', pinyin: 'shì',   definition: DEFINITIONS['是'], level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '在', pinyin: 'zài',   definition: DEFINITIONS['在'], level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '了', pinyin: 'le',    definition: DEFINITIONS['了'], level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '不', pinyin: 'bù',    definition: DEFINITIONS['不'], level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '人', pinyin: 'rén',   definition: DEFINITIONS['人'], level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '我', pinyin: 'wǒ',    definition: DEFINITIONS['我'], level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '有', pinyin: 'yǒu',   definition: DEFINITIONS['有'], level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '他', pinyin: 'tā',    definition: DEFINITIONS['他'], level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
  { character: '这', pinyin: 'zhè',   definition: DEFINITIONS['这'], level: 1, due: 0, stability: 0, difficulty: 0, elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, learning_steps: 0, state: 0, last_review: null },
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
    queue = [...queue.slice(0, idx), ...queue.slice(idx + 1), card];
  } else if (rating === 2) {
    queue.splice(idx, 1);
    queue.splice(Math.min(idx + 3, queue.length), 0, card);
  } else {
    queue.splice(idx, 1);
    masteredCount += card.reps >= 3 ? 1 : 0;
  }
}

export async function mockGetCard(id: number): Promise<CharCard | null> {
  return queue.find(c => c.id === id) ?? null;
}

export async function mockGetCardStats(): Promise<CardStats> {
  return {
    total: SEED.length,
    due: queue.length,
    new: queue.filter(c => c.reps === 0).length,
    mastered: masteredCount,
  };
}
