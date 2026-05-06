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

// ─── Layout constants ──────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const WRITING_SIZE = Math.min(SCREEN_W - 48, 320);
const PANEL_SIZE   = Math.floor((SCREEN_W - 56) / 2);

// ─── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'writing' | 'reviewing';
interface Definition { meaning: string; examples: string[]; words?: string[] }

function parseDefinition(raw: string | null): Definition | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function splitByChar(text: string, char: string) {
  const parts = text.split(char);
  const out: { text: string; isTarget: boolean }[] = [];
  parts.forEach((part, i) => {
    if (part) out.push({ text: part, isTarget: false });
    if (i < parts.length - 1) out.push({ text: char, isTarget: true });
  });
  return out;
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function PracticeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cardId  = Number(id);

  const canvasRef               = useRef<HandwritingCanvasRef>(null);
  const [card, setCard]         = useState<CharCard | null>(null);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase]       = useState<Phase>('writing');
  const [showAnim, setShowAnim] = useState(false);

  const loadCard = useCallback(async () => {
    setLoading(true);
    setPhase('writing');
    setShowAnim(false);
    canvasRef.current?.clear();
    try {
      const found = await fetchCard(cardId);
      if (!found) { router.replace('/'); return; }
      setCard(found);
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => { loadCard(); }, [loadCard]);

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E63946" />
      </View>
    );
  }
  if (!card) return null;

  const definition   = parseDefinition(card.definition);
  const example      = definition?.examples[0] ?? null;
  const isReviewing  = phase === 'reviewing';
  const segments     = example && isReviewing ? splitByChar(example, card.character) : null;

  // ─────────────────────────────────────────────────────────────────────────────
  // IMPORTANT: This component always returns ONE SafeAreaView with the
  // HandwritingCanvas at a fixed position in the tree (always child[1] of the
  // canvas panel, which is always child[0] of the main area). This lets React
  // reconcile across phase changes without unmounting the canvas — preserving
  // the user's drawing when switching from writing → reviewing.
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.screen}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.pinyin}>{card.pinyin ?? '—'}</Text>
        <Text style={styles.repsTag}>
          {card.reps === 0 ? '🆕 新字' : `第 ${card.reps + 1} 次复习`}
        </Text>
      </View>

      {/* ── Example sentence (blanked → highlighted) ── */}
      {example && (
        <View style={styles.sentenceRow}>
          {segments ? (
            <Text style={styles.sentenceText}>
              {segments.map((seg, i) =>
                seg.isTarget
                  ? <Text key={i} style={styles.sentenceHighlight}>{seg.text}</Text>
                  : <Text key={i}>{seg.text}</Text>
              )}
            </Text>
          ) : (
            <Text style={styles.sentenceText}>
              {example.split(card.character).join('＿')}
            </Text>
          )}
        </View>
      )}

      {/* ── Main area ── */}
      {/*
        flexDirection switches between 'column' (writing) and 'row' (reviewing).
        The canvas panel is ALWAYS child[0], HandwritingCanvas is ALWAYS child[1]
        inside the canvas panel — React reuses the same DOM node both phases.
      */}
      <View style={[styles.mainArea, isReviewing && styles.mainAreaRow]}>

        {/* Canvas panel — always rendered at child[0] of mainArea */}
        <View style={[styles.canvasPanel, isReviewing && styles.panelCol]}>

          {/* Label: always at child[0]; hidden in writing phase via display:none
              so it doesn't affect layout but keeps HandwritingCanvas at child[1] */}
          <Text style={[styles.panelLabel, !isReviewing && styles.hidden]}>
            手写区
          </Text>

          {/* HandwritingCanvas: always at child[1] of canvasPanel */}
          <View pointerEvents={isReviewing ? 'none' : 'auto'}>
            <HandwritingCanvas
              ref={canvasRef}
              size={WRITING_SIZE}
              displaySize={isReviewing ? PANEL_SIZE : WRITING_SIZE}
            />
          </View>

          {/* 清空 only shown in writing phase; at child[2] — toggling it
              doesn't affect the canvas position above */}
          {!isReviewing && (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => canvasRef.current?.clear()}
            >
              <Text style={styles.secondaryText}>清空</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Reference panel — only in reviewing phase */}
        {isReviewing && (
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
              style={styles.actionBtn}
              onPress={() => setShowAnim(v => !v)}
            >
              <Text style={styles.actionText}>{showAnim ? '显示字形' : '看笔顺'}</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>

      {/* ── Bottom actions ── */}
      {isReviewing ? (
        <>
          <SelfJudgePanel onRate={handleRate} disabled={submitting} />
          {submitting && <ActivityIndicator style={styles.submitSpinner} color="#aaa" />}
        </>
      ) : (
        <View style={styles.writingActions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setPhase('reviewing')}>
            <Text style={styles.primaryText}>写完了</Text>
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAFA' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header:  { alignItems: 'center', paddingVertical: 16, gap: 4 },
  pinyin:  { fontSize: 26, color: '#E63946', letterSpacing: 2 },
  repsTag: { fontSize: 12, color: '#aaa' },

  // Example sentence
  sentenceRow: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 12 },
  sentenceText:      { fontSize: 18, color: '#444', lineHeight: 28, textAlign: 'center' },
  sentenceHighlight: { color: '#E63946', fontWeight: '600' },

  // Main area — switches between column (writing) and row (reviewing)
  mainArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainAreaRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'flex-start',
  },

  // Canvas panel
  canvasPanel: { alignItems: 'center', gap: 8 },
  panelCol:    { alignItems: 'center', gap: 8 },
  panelLabel:  { fontSize: 11, color: '#aaa', letterSpacing: 0.5 },
  hidden:      { display: 'none' },

  // Reference character box
  refBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d0d0d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refChar: { color: '#1a1a1a', lineHeight: undefined },

  // Writing phase bottom
  writingActions: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#E63946',
    alignItems: 'center',
  },
  primaryText:  { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryBtn: {
    paddingHorizontal: 24, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#f0f0f0',
  },
  secondaryText: { color: '#555', fontSize: 14 },

  // Review phase panel buttons
  actionBtn:  { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f0f0f0' },
  actionText: { fontSize: 13, color: '#555' },

  submitSpinner: { marginBottom: 12 },
});
