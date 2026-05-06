import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { type UserRating } from '@/db/srs';

interface Props {
  onRate: (rating: UserRating) => void;
  disabled?: boolean;
}

const BUTTONS: { rating: UserRating; label: string; sub: string; color: string }[] = [
  { rating: 1, label: '又错了', sub: '重来',  color: '#E63946' },
  { rating: 2, label: '有点难', sub: '再练',  color: '#F4A261' },
  { rating: 3, label: '记住了', sub: '继续',  color: '#2A9D8F' },
];

export default function SelfJudgePanel({ onRate, disabled = false }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.hint}>自我评价</Text>
      <View style={styles.row}>
        {BUTTONS.map(({ rating, label, sub, color }) => (
          <TouchableOpacity
            key={rating}
            style={[styles.btn, { borderColor: color }, disabled && styles.dimmed]}
            onPress={() => onRate(rating)}
            disabled={disabled}
            activeOpacity={0.75}
          >
            <Text style={[styles.label, { color }]}>{label}</Text>
            <Text style={styles.sub}>{sub}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 8, alignItems: 'center', gap: 10 },
  hint:      { fontSize: 12, color: '#aaa', letterSpacing: 0.5 },
  row:       { flexDirection: 'row', gap: 10, width: '100%' },
  btn: {
    flex: 1, borderWidth: 1.5, borderRadius: 14, backgroundColor: '#fff',
    paddingVertical: 14, alignItems: 'center', gap: 2,
  },
  dimmed: { opacity: 0.4 },
  label:  { fontSize: 16, fontWeight: '600' },
  sub:    { fontSize: 11, color: '#aaa' },
});
