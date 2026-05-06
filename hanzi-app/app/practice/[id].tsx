import { useRef, useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator, Dimensions, Platform,
  StyleSheet, Text, TouchableOpacity, View, SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import HandwritingCanvas, { type HandwritingCanvasRef } from '@/components/HandwritingCanvas';
import StrokeAnimation from '@/components/StrokeAnimation';
import SelfJudgePanel from '@/components/SelfJudgePanel';
import { getCard, getDueCards, rateCard, type CharCard, type UserRating } from '@/db/srs';
import { mockGetCard, mockGetDueCards, mockRateCard } from '@/db/mock';

// ─── Platform-specific data layer ─────────────────────────────────────────────

const isWeb      = Platform.OS === 'web';
const fetchCard  = isWeb ? mockGetCard    : getCard;
const fetchDue   = isWeb ? mockGetDueCards : getDueCards;
const submitRate = isWeb ? mockRateCard   : rateCard;

// ─── Screen ────────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const PANEL_SIZE = Math.floor((SCREEN_W - 56) / 2); // two equal panels with gap+padding

export default function PracticeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cardId  = Number(id);

  const canvasRef               = useRef<HandwritingCanvasRef>(null);
  const [card, setCard]         = useState<CharCard | null>(null);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAnim, setShowAnim] = useState(false);

  // ── Load card ──────────────────────────────────────────────────────────────

  const loadCard = useCallback(async () => {
    setLoading(true);
    setShowAnim(false);
    canvasRef.current?.clear();
    try {
      const found = await fetchCard(cardId);
      if (!found) {
        // Card no longer due — go back to today's list
        router.replace('/');
        return;
      }
      setCard(found);
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => { loadCard(); }, [loadCard]);

  // ── Rating handler ─────────────────────────────────────────────────────────

  const handleRate = async (rating: UserRating) => {
    if (!card || submitting) return;
    setSubmitting(true);
    try {
      await submitRate(card.id, rating);
      const next = await fetchDue(1);
      if (next.length > 0 && next[0].id !== card.id) {
        router.replace({ pathname: '/practice/[id]', params: { id: next[0].id } });
      } else {
        router.replace('/');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E63946" />
      </View>
    );
  }

  if (!card) return null;

  return (
    <SafeAreaView style={styles.screen}>

      {/* ── Pinyin header ── */}
      <View style={styles.header}>
        <Text style={styles.pinyin}>{card.pinyin ?? '—'}</Text>
        <Text style={styles.repsTag}>
          {card.reps === 0 ? '🆕 新字' : `第 ${card.reps + 1} 次复习`}
        </Text>
      </View>

      {/* ── Canvas + Reference ── */}
      <View style={styles.panels}>

        {/* Left: handwriting area */}
        <View style={styles.panelCol}>
          <Text style={styles.panelLabel}>手写区</Text>
          <HandwritingCanvas ref={canvasRef} size={PANEL_SIZE} />
          <TouchableOpacity style={styles.clearBtn} onPress={() => canvasRef.current?.clear()}>
            <Text style={styles.clearText}>清空</Text>
          </TouchableOpacity>
        </View>

        {/* Right: reference / stroke animation */}
        <View style={styles.panelCol}>
          <Text style={styles.panelLabel}>
            {showAnim ? '笔顺动画' : '标准字形'}
          </Text>
          {showAnim ? (
            <StrokeAnimation character={card.character} size={PANEL_SIZE} autoPlay />
          ) : (
            <View style={[styles.refBox, { width: PANEL_SIZE, height: PANEL_SIZE }]}>
              <Text style={[styles.refChar, { fontSize: PANEL_SIZE * 0.6 }]}>
                {card.character}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => setShowAnim(v => !v)}
          >
            <Text style={styles.clearText}>
              {showAnim ? '显示字形' : '看笔顺'}
            </Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* ── Self-judge ── */}
      <SelfJudgePanel onRate={handleRate} disabled={submitting} />

      {submitting && (
        <ActivityIndicator style={styles.submitSpinner} color="#aaa" />
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: '#FAFAFA' },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  pinyin:  { fontSize: 26, color: '#E63946', letterSpacing: 2 },
  repsTag: { fontSize: 12, color: '#aaa' },

  // Panels
  panels: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelCol: { alignItems: 'center', gap: 8 },
  panelLabel: { fontSize: 11, color: '#aaa', letterSpacing: 0.5 },

  // Reference box (static char before animation toggle)
  refBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d0d0d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refChar: { color: '#1a1a1a', lineHeight: undefined },

  // Buttons under panels
  clearBtn: {
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, backgroundColor: '#f0f0f0',
  },
  clearText: { fontSize: 13, color: '#555' },

  submitSpinner: { marginBottom: 12 },
});
