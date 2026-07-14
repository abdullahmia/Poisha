import { Feather } from '@expo/vector-icons';
import { clsx } from 'clsx';
import type React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useCalendarGrid } from '@/lib/hooks/use-calendar-grid.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export type DatePickerProps = {
  value: string; // ISO date
  onChange: (iso: string) => void;
  maximumDate?: Date;
};

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, maximumDate }) => {
  const { colors } = useTheme();
  const { monthLabel, weeks, goToPrevMonth, goToNextMonth, canGoNext } = useCalendarGrid(value, maximumDate);

  return (
    <View className="px-5 pb-2">
      <View className="mb-4 flex-row items-center justify-between">
        <Pressable
          onPress={goToPrevMonth}
          className="h-9 w-9 items-center justify-center rounded-full bg-surface-alt"
          accessibilityLabel="Previous month"
        >
          <Feather name="chevron-left" size={16} color={colors.inkSoft} />
        </Pressable>
        <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 16 }}>
          {monthLabel}
        </Text>
        <Pressable
          onPress={goToNextMonth}
          disabled={!canGoNext}
          className="h-9 w-9 items-center justify-center rounded-full bg-surface-alt"
          style={!canGoNext ? { opacity: 0.3 } : undefined}
          accessibilityLabel="Next month"
        >
          <Feather name="chevron-right" size={16} color={colors.inkSoft} />
        </Pressable>
      </View>

      <View className="mb-1 flex-row">
        {WEEKDAY_LABELS.map((label, i) => (
          <View key={i} className="flex-1 items-center">
            <Text className="text-ink-muted" style={{ fontSize: 11, fontFamily: 'Inter_500Medium' }}>{label}</Text>
          </View>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} className="flex-row">
          {week.map(cell => (
            <View key={cell.iso} className="flex-1 items-center py-0.5">
              <Pressable
                onPress={() => onChange(cell.iso)}
                disabled={cell.isDisabled}
                className={clsx('h-9 w-9 items-center justify-center rounded-full', cell.isSelected && 'bg-accent')}
              >
                <Text
                  style={{
                    fontFamily: cell.isToday && !cell.isSelected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                    fontSize: 14,
                    color: cell.isSelected
                      ? colors.bg
                      : cell.isDisabled
                        ? colors.line
                        : !cell.inCurrentMonth
                          ? colors.inkMuted
                          : cell.isToday
                            ? colors.accent
                            : colors.ink,
                  }}
                >
                  {cell.day}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};
