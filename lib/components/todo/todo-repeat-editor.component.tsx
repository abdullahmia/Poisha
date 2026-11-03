import { Feather } from '@expo/vector-icons';
import type React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import type { TRepeatUnit, TTodoRepeat } from '@/lib/types';
import { FieldLabel, SelectChip } from './todo-chip.component';

type TodoRepeatEditorProps = {
  value: TTodoRepeat | null;
  onChange: (next: TTodoRepeat | null) => void;
};

const UNITS: { unit: TRepeatUnit; label: string }[] = [
  { unit: 'day', label: 'Daily' },
  { unit: 'week', label: 'Weekly' },
  { unit: 'month', label: 'Monthly' },
  { unit: 'year', label: 'Yearly' },
];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const BASE: TTodoRepeat = { unit: 'day', interval: 1, weekdays: [], anchor: 'dueDate' };

export const TodoRepeatEditor: React.FC<TodoRepeatEditorProps> = ({ value, onChange }) => {
  const { colors } = useTheme();

  function pickUnit(unit: TRepeatUnit) {
    // Switching away from weekly drops the weekday selection rather than
    // carrying it invisibly — it would reappear, surprising, on switching back.
    onChange({ ...(value ?? BASE), unit, weekdays: unit === 'week' ? value?.weekdays ?? [] : [] });
  }

  function bumpInterval(delta: number) {
    if (!value) return;
    onChange({ ...value, interval: Math.min(99, Math.max(1, value.interval + delta)) });
  }

  function toggleWeekday(day: number) {
    if (!value) return;
    const next = value.weekdays.includes(day)
      ? value.weekdays.filter(d => d !== day)
      : [...value.weekdays, day];
    onChange({ ...value, weekdays: next });
  }

  return (
    <View>
      <FieldLabel>Repeat</FieldLabel>

      <View className="flex-row flex-wrap gap-2">
        <SelectChip label="Never" selected={value === null} onPress={() => onChange(null)} />
        {UNITS.map(({ unit, label }) => (
          <SelectChip key={unit} label={label} selected={value?.unit === unit} onPress={() => pickUnit(unit)} />
        ))}
      </View>

      {value && (
        <View className="mt-3 gap-3 rounded-xl border border-line bg-bg p-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-ink-soft" style={{ fontFamily: 'Inter_400Regular', fontSize: 13 }}>
              Every {value.interval} {value.unit}
              {value.interval > 1 ? 's' : ''}
            </Text>
            <View className="flex-row items-center overflow-hidden rounded-lg bg-surface-alt">
              <Pressable
                onPress={() => bumpInterval(-1)}
                disabled={value.interval <= 1}
                hitSlop={6}
                className="px-2.5 py-1.5"
                style={value.interval <= 1 ? { opacity: 0.3 } : undefined}
                accessibilityLabel="Decrease interval"
              >
                <Feather name="minus" size={14} color={colors.inkSoft} />
              </Pressable>
              <View className="h-4 w-px bg-line" />
              <Pressable
                onPress={() => bumpInterval(1)}
                hitSlop={6}
                className="px-2.5 py-1.5"
                accessibilityLabel="Increase interval"
              >
                <Feather name="plus" size={14} color={colors.inkSoft} />
              </Pressable>
            </View>
          </View>

          {value.unit === 'week' && (
            <View>
              <Text className="mb-2 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 11.5 }}>
                On these days — leave empty to repeat on the due date&apos;s weekday.
              </Text>
              <View className="flex-row gap-1.5">
                {WEEKDAYS.map((label, day) => {
                  const selected = value.weekdays.includes(day);
                  return (
                    <Pressable
                      key={day}
                      onPress={() => toggleWeekday(day)}
                      className="h-8 flex-1 items-center justify-center rounded-lg border"
                      style={{
                        borderColor: selected ? colors.accent : colors.line,
                        backgroundColor: selected ? colors.accentSoft : 'transparent',
                      }}
                      accessibilityLabel={`Toggle day ${day + 1}`}
                      accessibilityState={{ selected }}
                    >
                      <Text
                        style={{
                          fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                          fontSize: 12,
                          color: selected ? colors.accent : colors.inkSoft,
                        }}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          <View>
            <Text className="mb-2 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 11.5 }}>
              Count the next one from
            </Text>
            <View className="flex-row gap-2">
              <SelectChip
                label="Its due date"
                selected={value.anchor === 'dueDate'}
                onPress={() => onChange({ ...value, anchor: 'dueDate' })}
              />
              <SelectChip
                label="When I finish it"
                selected={value.anchor === 'completion'}
                onPress={() => onChange({ ...value, anchor: 'completion' })}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
};
