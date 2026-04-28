import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ledger } from '@/lib/constants/theme';
import type { Entry } from '@/lib/types/entry.type';

const fmt = (n: number) => {
  if (n >= 100000) return `৳${(n / 1000).toFixed(0)}k`;
  if (n >= 10000) return `৳${(n / 1000).toFixed(1)}k`;
  return `৳${n.toLocaleString('en-IN')}`;
};

const fmtFull = (n: number) => `৳${n.toLocaleString('en-IN')}`;

function parseDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

interface EntryCardProps {
  entry: Entry;
  onClick: () => void;
  index?: number;
}

export function EntryCard({ entry, onClick }: EntryCardProps) {
  const total = entry.amounts.reduce((a, b) => a + b, 0);
  const multi = entry.amounts.length > 1;
  const d = parseDate(entry.date);

  return (
    <Pressable
      onPress={onClick}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {multi && <View style={styles.accentStripe} />}

      <View style={styles.left}>
        <View style={[styles.dateBox, multi && styles.dateBoxMulti]}>
          <Text style={[styles.dayNum, multi && styles.dayNumMulti]}>
            {d.getDate()}
          </Text>
          <Text style={[styles.monthLabel, multi && styles.monthLabelMulti]}>
            {d.toLocaleDateString('en-US', { month: 'short' })}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.weekday}>
            {d.toLocaleDateString('en-US', { weekday: 'long' })}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {multi ? `${entry.amounts.length} items` : entry.note || '—'}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={[styles.total, multi && styles.totalMulti]}>{fmtFull(total)}</Text>
        {multi && (
          <Text style={styles.breakdown} numberOfLines={1}>
            {entry.amounts.map(a => fmt(a)).join(' · ')}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ledger.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.985 }],
  },
  accentStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: ledger.accent,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 0,
  },
  dateBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: ledger.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dateBoxMulti: {
    backgroundColor: ledger.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,92,53,0.22)',
  },
  dayNum: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 16,
    lineHeight: 18,
    color: ledger.inkSoft,
  },
  dayNumMulti: {
    color: ledger.accent,
  },
  monthLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: ledger.inkMuted,
    marginTop: 2,
  },
  monthLabelMulti: {
    color: ledger.accent,
    opacity: 0.75,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  weekday: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: ledger.ink,
    letterSpacing: -0.1,
  },
  subtitle: {
    fontSize: 11,
    color: ledger.inkMuted,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    paddingLeft: 12,
  },
  total: {
    fontFamily: 'Fraunces_500Medium_Italic',
    fontSize: 20,
    color: ledger.ink,
    letterSpacing: -0.4,
  },
  totalMulti: {
    color: ledger.accent,
  },
  breakdown: {
    fontSize: 10,
    color: ledger.inkMuted,
    marginTop: 3,
    maxWidth: 130,
  },
});
