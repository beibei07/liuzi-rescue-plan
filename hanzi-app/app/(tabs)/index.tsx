import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { getDatabase } from '@/db/db';
import { CharCard } from '@/db/srs';

interface DebugRow {
  id: number;
  character: string;
  due: number;
  state: number;
  reps: number;
}

export default function TodayPracticeScreen() {
  const [rows, setRows]       = useState<DebugRow[]>([]);
  const [total, setTotal]     = useState<number | null>(null);
  const [now, setNow]         = useState<number>(Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const query = useCallback(async () => {
    if (Platform.OS === 'web') {
      setError('SQLite not available on web');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const db = await getDatabase();
      const ts = Date.now();
      setNow(ts);

      const count = await db.getFirstAsync<{ c: number }>(
        'SELECT COUNT(*) as c FROM char_cards'
      );
      setTotal(count?.c ?? 0);

      const data = await db.getAllAsync<DebugRow>(
        'SELECT id, character, due, state, reps FROM char_cards ORDER BY due ASC'
      );
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { query(); }, [query]);

  const dueCount = rows.filter(r => r.due <= now).length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>🗄 DB Debug</Text>

      <View style={styles.box}>
        <Text style={styles.label}>现在时间戳</Text>
        <Text style={styles.mono}>{now}</Text>
        <Text style={styles.label}>char_cards 总记录数</Text>
        <Text style={styles.mono}>{total ?? '…'}</Text>
        <Text style={styles.label}>due ≤ now（到期）</Text>
        <Text style={styles.mono}>{dueCount}</Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <Text style={styles.dim}>查询中…</Text>
      ) : (
        rows.map(r => {
          const isDue = r.due <= now;
          const diff  = r.due - now;
          return (
            <View key={r.id} style={[styles.row, isDue && styles.rowDue]}>
              <Text style={styles.char}>{r.character}</Text>
              <View style={styles.rowRight}>
                <Text style={styles.mono}>due: {r.due}</Text>
                <Text style={[styles.mono, styles.dim]}>
                  {isDue
                    ? `✅ 已到期 (${Math.round(-diff / 1000)}s 前)`
                    : `⏳ 未到期 (+${Math.round(diff / 1000)}s)`}
                </Text>
                <Text style={styles.dim}>state={r.state}  reps={r.reps}</Text>
              </View>
            </View>
          );
        })
      )}

      <TouchableOpacity style={styles.btn} onPress={query}>
        <Text style={styles.btnText}>🔄 重新查询</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, backgroundColor: '#fff' },
  heading:   { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  box: {
    backgroundColor: '#f5f5f5', borderRadius: 8,
    padding: 12, marginBottom: 16, gap: 2,
  },
  label:   { fontSize: 11, color: '#888', marginTop: 6 },
  mono:    { fontFamily: 'SpaceMono', fontSize: 12 },
  dim:     { fontSize: 11, color: '#aaa' },
  error:   { color: 'red', marginBottom: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee', gap: 12,
  },
  rowDue:  { backgroundColor: '#f0fff4' },
  char:    { fontSize: 32, width: 44, textAlign: 'center' },
  rowRight: { flex: 1, gap: 2 },
  btn: {
    marginTop: 24, backgroundColor: '#333', borderRadius: 8,
    paddingVertical: 12, alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: 'bold' },
});
