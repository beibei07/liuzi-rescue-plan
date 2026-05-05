import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import {
  getDueCards,
  rateCard,
  getCardStats,
  type CharCard,
  type CardStats,
  type UserRating,
} from '@/db/srs';
import {
  mockGetDueCards,
  mockRateCard,
  mockGetCardStats,
} from '@/db/mock';

const isWeb = Platform.OS === 'web';

const fetchDue    = isWeb ? mockGetDueCards    : getDueCards;
const fetchStats  = isWeb ? mockGetCardStats   : getCardStats;
const submitRate  = isWeb ? mockRateCard       : rateCard;

export interface UseSRSResult {
  dueCards: CharCard[];
  stats: CardStats;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  submitRating: (cardId: number, rating: UserRating) => Promise<void>;
}

export function useSRS(dueLimit: number = 50): UseSRSResult {
  const [dueCards, setDueCards] = useState<CharCard[]>([]);
  const [stats, setStats] = useState<CardStats>({ total: 0, due: 0, new: 0, mastered: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cards, cardStats] = await Promise.all([
        fetchDue(dueLimit),
        fetchStats(),
      ]);
      setDueCards(cards);
      setStats(cardStats);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [dueLimit]);

  const submitRating = useCallback(
    async (cardId: number, rating: UserRating) => {
      await submitRate(cardId, rating);
      await refresh();
    },
    [refresh]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { dueCards, stats, loading, error, refresh, submitRating };
}
