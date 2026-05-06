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
// Writing phase: canvas fills most of the screen width
const WRITING_SIZE = Math.min(SCREEN_W - 48, 320);
// Review phase: two equal panels with gap + padding
const PANEL_SIZE   = Math.floor((SCREEN_W - 56) / 2);

// ─── Definition parsing ────────────────────────────────────────────────────────

interface Definition { meaning: string; examples: string[] }

function parseDefinition(raw: string | null): Definition | null {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// Splits `text` into segments, tagging occurrences of `char` as targets.
// e.g. splitByChar('这本书很好', '这') → [{text:'这',isTarget:true},{text:'本书很好',isTarget:false}]
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

type Phase = 'writing' | 'reviewing';

export default function PracticeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cardId  = Number(id);

  const canvasRef               = useRef<HandwritingCanvasRef>(null);
  const [card, setCard]         = useState<CharCard | null>(null);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase]       = useState<Phase>('writing');
  const [showAnim, setShowAnim] = useState(false);

  // ── Load card ──────────────────────────────────────────────────────────────

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

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleDoneWriting = () => {
    setPhase('reviewing');
    setShowAnim(false);
  };

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

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E63946" />
      </View>
    );
  }
  if (!card) return null;

  const definition = parseDefinition(card.definition);
  const example    = definition?.examples[0] ?? null;

  // ── Writing phase ──────────────────────────────────────────────────────────

  if (phase === 'writing') {
    return (
      <SafeAreaView style={styles.screen}>

        {/* Pinyin + reps */}
        <View style={styles.header}>
          <Text style={styles.pinyin}>{card.pinyin ?? '—'}</Text>
          <Text style={styles.repsTag}>
            {card.reps === 0 ? '🆕 新字' : `第 ${card.reps + 1} 次复习`}
          </Text>
        </View>

        {/* Example sentence with target character blanked */}
        {example && (
          <View style={styles.sentenceRow}>
            <Text style={styles.sentenceText}>
              {example.split(card.character).join('＿')}
            </Text>
          </View>
        )}

        {/* Large centered canvas */}
        <View style={styles.canvasArea}>
          <HandwritingCanvas ref={canvasRef} size={WRITING_SIZE} />
        </View>

        {/* Action buttons */}
        <View style={styles.writingActions}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => canvasRef.current?.clear()}
          >
            <Text style={styles.secondaryText}>清空</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleDoneWriting}
          >
            <Text style={styles.primaryText}>写完了</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    );
  }

  // ── Reviewing phase ────────────────────────────────────────────────────────

  const segments = example ? splitByChar(example, card.character) : null;

  return (
    <SafeAreaView style={styles.screen}>

      {/* Pinyin + reps */}
      <View style={styles.header}>
        <Text style={styles.pinyin}>{card.pinyin ?? '—'}</Text>
        <Text style={styles.repsTag}>
          {card.reps === 0 ? '🆕 新字' : `第 ${card.reps + 1} 次复习`}
        </Text>
      </View>

      {/* Example sentence — character highlighted in red */}
      {segments && (
        <View style={styles.sentenceRow}>
          <Text style={styles.sentenceText}>
            {segments.map((seg, i) =>
              seg.isTarget
                ? <Text key={i} style={styles.sentenceHighlight}>{seg.text}</Text>
                : <Text key={i}>{seg.text}</Text>
            )}
          </Text>
        </View>
      )}

      {/* Two-panel comparison */}
      <View style={styles.panels}>

        {/* Left: what the user wrote (read-only, scaled down) */}
        <View style={styles.panelCol}>
          <Text style={styles.panelLabel}>手写区</Text>
          {/* pointerEvents="none" makes canvas read-only in review phase */}
          <View pointerEvents="none">
            <HandwritingCanvas
              ref={canvasRef}
              size={WRITING_SIZE}
              displaySize={PANEL_SIZE}
            />
          </View>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => { canvasRef.current?.clear(); setPhase('writing'); }}
          >
            <Text style={styles.actionText}>重写</Text>
          </TouchableOpacity>
        </View>

        {/* Right: reference character / stroke animation */}
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

      </View>

      {/* Self-judge */}
      <SelfJudgePanel onRate={handleRate} disabled={submitting} />

      {submitting && <ActivityIndicator style={styles.submitSpinner} color="#aaa" />}

    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAFA' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: { alignItems: 'center', paddingVertical: 16, gap: 4 },
  pinyin:  { fontSize: 26, color: '#E63946', letterSpacing: 2 },
  repsTag: { fontSize: 12, color: '#aaa' },

  // Example sentence
  sentenceRow: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  sentenceText:      { fontSize: 18, color: '#444', lineHeight: 28, textAlign: 'center' },
  sentenceHighlight: { color: '#E63946', fontWeight: '600' },

  // Writing phase
  canvasArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  writingActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#E63946',
    alignItems: 'center',
  },
  primaryText:   { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryBtn:  {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  secondaryText: { color: '#555', fontSize: 16 },

  // Review phase panels
  panels: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelCol:   { alignItems: 'center', gap: 8 },
  panelLabel: { fontSize: 11, color: '#aaa', letterSpacing: 0.5 },

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

  // Small action buttons under panels
  actionBtn:  {
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, backgroundColor: '#f0f0f0',
  },
  actionText: { fontSize: 13, color: '#555' },

  submitSpinner: { marginBottom: 12 },
});
