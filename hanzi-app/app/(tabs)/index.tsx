import { useState } from 'react';
import {
  ActivityIndicator, SafeAreaView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { router } from 'expo-router';
import { useSRS } from '@/hooks/useSRS';

export default function TodayPracticeScreen() {
  const { dueCards, stats, loading } = useSRS();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#E63946" />
        <Text style={styles.loadingText}>加载中…</Text>
      </View>
    );
  }

  // ── All done ──────────────────────────────────────────────────────────────
  if (dueCards.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.doneEmoji}>🎉</Text>
        <Text style={styles.doneTitle}>今日已完成！</Text>
        <Text style={styles.doneSub}>
          词库 {stats.total} 个字 · 已掌握 {stats.mastered} 个
        </Text>
      </View>
    );
  }

  const card = dueCards[0];

  // ── Practice queue ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.screen}>

      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          {card.reps === 0 ? '🆕 新字' : '🔄 复习'}
        </Text>
        <Text style={styles.progressText}>剩余 {dueCards.length} 张</Text>
      </View>

      {/* Tappable card → practice page */}
      <View style={styles.cardArea}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => router.push({ pathname: '/practice/[id]', params: { id: card.id } })}
        >
          <Text style={styles.character}>{card.character}</Text>
          {card.pinyin ? <Text style={styles.pinyin}>{card.pinyin}</Text> : null}
          <View style={styles.divider} />
          <Text style={styles.hint}>
            {card.reps === 0 ? '第一次见 — 点击开始手写练习' : `已练 ${card.reps} 次 — 点击继续`}
          </Text>
          <View style={styles.startBadge}>
            <Text style={styles.startBadgeText}>✏️ 开始练习</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      <View style={styles.statsRow}>
        <StatChip label="词库"    value={stats.total}    />
        <StatChip label="今日到期" value={stats.due}      />
        <StatChip label="新字"    value={stats.new}      />
        <StatChip label="已掌握"  value={stats.mastered} />
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAFAFA' },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 12, backgroundColor: '#FAFAFA',
  },

  progressRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  progressText: { fontSize: 13, color: '#888' },

  cardArea: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24,
  },
  card: {
    width: '100%', backgroundColor: '#fff', borderRadius: 20,
    paddingVertical: 40, paddingHorizontal: 24, alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  character: { fontSize: 96, lineHeight: 112, color: '#1a1a1a' },
  pinyin:    { fontSize: 22, color: '#E63946', letterSpacing: 1 },
  divider:   {
    height: StyleSheet.hairlineWidth, backgroundColor: '#eee',
    width: '60%', marginVertical: 8,
  },
  hint: { fontSize: 13, color: '#aaa' },
  startBadge: {
    marginTop: 8, paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#E63946',
  },
  startBadgeText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e8e8e8', backgroundColor: '#fff',
  },
  chip:      { alignItems: 'center', gap: 2 },
  chipValue: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
  chipLabel: { fontSize: 11, color: '#aaa' },

  loadingText: { marginTop: 8, color: '#aaa' },
  doneEmoji:   { fontSize: 56 },
  doneTitle:   { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
  doneSub:     { fontSize: 14, color: '#888' },
});
