import { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  ActivityIndicator, Platform, SafeAreaView,
} from 'react-native';
import { useSRS } from '@/hooks/useSRS';
import { type UserRating } from '@/db/srs';

// ─── Rating button ─────────────────────────────────────────────────────────

interface RatingButtonProps {
  label: string;
  sub: string;
  color: string;
  onPress: () => void;
  disabled: boolean;
}

function RatingButton({ label, sub, color, onPress, disabled }: RatingButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.ratingBtn, { borderColor: color }, disabled && styles.ratingBtnDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
    >
      <Text style={[styles.ratingLabel, { color }]}>{label}</Text>
      <Text style={styles.ratingSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

// ─── Empty / done state ────────────────────────────────────────────────────

function DoneView({ total, mastered }: { total: number; mastered: number }) {
  return (
    <View style={styles.center}>
      <Text style={styles.doneEmoji}>🎉</Text>
      <Text style={styles.doneTitle}>今日已完成！</Text>
      <Text style={styles.doneSub}>
        词库 {total} 个字 · 已掌握 {mastered} 个
      </Text>
    </View>
  );
}

// ─── Web placeholder ───────────────────────────────────────────────────────

function WebView() {
  return (
    <View style={styles.center}>
      <Text style={styles.doneEmoji}>📱</Text>
      <Text style={styles.doneTitle}>请在手机上使用</Text>
      <Text style={styles.doneSub}>Web 端不支持 SQLite，请用 Expo Go 扫码</Text>
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────

export default function TodayPracticeScreen() {
  const { dueCards, stats, loading, submitRating } = useSRS();
  const [submitting, setSubmitting] = useState(false);

  if (Platform.OS === 'web') return <WebView />;

  if (loading && !submitting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E63946" />
        <Text style={styles.loadingText}>加载中…</Text>
      </View>
    );
  }

  if (dueCards.length === 0) {
    return <DoneView total={stats.total} mastered={stats.mastered} />;
  }

  const card = dueCards[0];
  const remaining = dueCards.length;

  const handleRate = async (rating: UserRating) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitRating(card.id, rating);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>

      {/* ── Progress bar ── */}
      <View style={styles.progressBar}>
        <Text style={styles.progressText}>
          {card.reps === 0 ? '🆕 新字' : '🔄 复习'}
        </Text>
        <Text style={styles.progressText}>剩余 {remaining} 张</Text>
      </View>

      {/* ── Character card ── */}
      <View style={styles.cardArea}>
        <View style={styles.card}>
          <Text style={styles.character}>{card.character}</Text>
          {card.pinyin ? (
            <Text style={styles.pinyin}>{card.pinyin}</Text>
          ) : null}
          <View style={styles.cardDivider} />
          <Text style={styles.cardHint}>
            {card.reps === 0
              ? '第一次见，认识它吗？'
              : `已练 ${card.reps} 次，还记得吗？`}
          </Text>
        </View>
      </View>

      {/* ── Rating buttons ── */}
      <View style={styles.ratingArea}>
        <Text style={styles.ratingTitle}>自我评价</Text>
        <View style={styles.ratingRow}>
          <RatingButton
            label="又错了"  sub="重来"
            color="#E63946" onPress={() => handleRate(1)} disabled={submitting}
          />
          <RatingButton
            label="有点难"  sub="再练"
            color="#F4A261" onPress={() => handleRate(2)} disabled={submitting}
          />
          <RatingButton
            label="记住了"  sub="继续"
            color="#2A9D8F" onPress={() => handleRate(3)} disabled={submitting}
          />
        </View>
        {submitting && (
          <ActivityIndicator style={{ marginTop: 12 }} color="#aaa" />
        )}
      </View>

      {/* ── Bottom stats ── */}
      <View style={styles.statsRow}>
        <StatChip label="词库" value={stats.total} />
        <StatChip label="今日到期" value={stats.due} />
        <StatChip label="新字" value={stats.new} />
        <StatChip label="已掌握" value={stats.mastered} />
      </View>

    </SafeAreaView>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FAFAFA',
  },

  // Progress
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  progressText: {
    fontSize: 13,
    color: '#888',
  },

  // Card
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  character: {
    fontSize: 96,
    lineHeight: 112,
    color: '#1a1a1a',
  },
  pinyin: {
    fontSize: 22,
    color: '#E63946',
    letterSpacing: 1,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#eee',
    width: '60%',
    marginVertical: 8,
  },
  cardHint: {
    fontSize: 13,
    color: '#aaa',
  },

  // Rating
  ratingArea: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignItems: 'center',
    gap: 12,
  },
  ratingTitle: {
    fontSize: 13,
    color: '#aaa',
    letterSpacing: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ratingBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#fff',
  },
  ratingBtnDisabled: {
    opacity: 0.4,
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  ratingSub: {
    fontSize: 11,
    color: '#aaa',
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e8e8e8',
    backgroundColor: '#fff',
  },
  chip: { alignItems: 'center', gap: 2 },
  chipValue: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  chipLabel: { fontSize: 11, color: '#aaa' },

  // Loading / done
  loadingText: { marginTop: 8, color: '#aaa' },
  doneEmoji:  { fontSize: 56 },
  doneTitle:  { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  doneSub:    { fontSize: 14, color: '#888' },
});
