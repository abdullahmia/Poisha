import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { type Palette } from '@/lib/constants/theme';
import { useLocale } from '@/lib/hooks/use-locale.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import type { Entry } from '@/lib/types/entry.type';

function parseDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

interface EntryCardProps {
  entry: Entry;
  onClick: () => void;
  index?: number;
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
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
      backgroundColor: c.accent,
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
      backgroundColor: c.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    dateBoxMulti: {
      backgroundColor: c.accentSoft,
      borderWidth: 1,
      borderColor: c.line,
    },
    dayNum: {
      fontFamily: 'SpaceGrotesk_600SemiBold',
      fontSize: 15,
      lineHeight: 18,
      color: c.inkSoft,
    },
    dayNumMulti: {
      color: c.accent,
    },
    monthLabel: {
      fontSize: 8,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      color: c.inkMuted,
      marginTop: 2,
    },
    monthLabelMulti: {
      color: c.accent,
      opacity: 0.75,
    },
    info: {
      flex: 1,
      minWidth: 0,
    },
    weekday: {
      fontFamily: 'Inter_500Medium',
      fontSize: 13,
      color: c.ink,
      letterSpacing: -0.1,
    },
    subtitle: {
      fontSize: 11,
      color: c.inkMuted,
      marginTop: 2,
    },
    right: {
      alignItems: 'flex-end',
      paddingLeft: 12,
    },
    total: {
      fontFamily: 'SpaceGrotesk_600SemiBold',
      fontSize: 18,
      color: c.ink,
      letterSpacing: -0.3,
    },
    totalMulti: {
      color: c.accent,
    },
    breakdown: {
      fontSize: 10,
      color: c.inkMuted,
      marginTop: 3,
      maxWidth: 130,
    },
  });
}

export function EntryCard({ entry, onClick }: EntryCardProps) {
  const { colors } = useTheme();
  const { fmt, fmtFull } = useLocale();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
