import { Feather } from '@expo/vector-icons';
import type React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/lib/hooks/use-theme.hook';

type TodoTimePickerProps = {
  /** 'HH:MM', 24-hour. */
  value: string;
  onChange: (next: string) => void;
};

const QUICK_TIMES = ['07:00', '09:00', '12:00', '15:00', '18:00', '21:00'];

function parse(value: string): { hour: number; minute: number } {
  const [h, m] = value.split(':').map(Number);
  return {
    hour: Number.isFinite(h) ? Math.min(23, Math.max(0, h)) : 9,
    minute: Number.isFinite(m) ? Math.min(59, Math.max(0, m)) : 0,
  };
}

function format(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * Steppers plus a row of common times, rather than a platform date-time dialog.
 * The app already hand-rolls its calendar (`DatePicker`) to keep one look
 * across iOS and Android; a native time modal here would be the only piece of
 * system chrome in the module.
 */
export const TodoTimePicker: React.FC<TodoTimePickerProps> = ({ value, onChange }) => {
  const { colors } = useTheme();
  const { hour, minute } = parse(value);

  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const isPM = hour >= 12;

  // Wrapping rather than clamping: stepping past midnight from 11 PM should
  // land on 12 AM, not stick.
  function bumpHour(delta: number) {
    onChange(format((hour + delta + 24) % 24, minute));
  }

  function bumpMinute(delta: number) {
    const total = hour * 60 + minute + delta;
    const wrapped = (total + 1440) % 1440;
    onChange(format(Math.floor(wrapped / 60), wrapped % 60));
  }

  function togglePeriod() {
    onChange(format((hour + 12) % 24, minute));
  }

  return (
    <View>
      <View className="flex-row items-center justify-center gap-2 rounded-xl border border-line bg-bg py-3">
        <Stepper label="Hour" onUp={() => bumpHour(1)} onDown={() => bumpHour(-1)}>
          {String(hour12).padStart(2, '0')}
        </Stepper>

        <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 24, marginTop: -2 }}>
          :
        </Text>

        <Stepper label="Minute" onUp={() => bumpMinute(5)} onDown={() => bumpMinute(-5)}>
          {String(minute).padStart(2, '0')}
        </Stepper>

        <Pressable
          onPress={togglePeriod}
          className="ml-2 rounded-lg border border-line px-3 py-2 active:opacity-60"
          accessibilityLabel={`Switch to ${isPM ? 'AM' : 'PM'}`}
        >
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.ink }}>
            {isPM ? 'PM' : 'AM'}
          </Text>
        </Pressable>
      </View>

      <View className="mt-2.5 flex-row flex-wrap gap-2">
        {QUICK_TIMES.map(time => {
          const selected = time === value;
          const [h, m] = time.split(':').map(Number);
          const label = `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
          return (
            <Pressable
              key={time}
              onPress={() => onChange(time)}
              className="rounded-full border px-3 py-1.5 active:opacity-65"
              style={{
                borderColor: selected ? colors.accent : colors.line,
                backgroundColor: selected ? colors.accentSoft : 'transparent',
              }}
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
  );
};

function Stepper({
  children,
  label,
  onUp,
  onDown,
}: {
  children: string;
  label: string;
  onUp: () => void;
  onDown: () => void;
}) {
  const { colors } = useTheme();

  return (
    <View className="items-center">
      <Pressable onPress={onUp} hitSlop={8} accessibilityLabel={`${label} up`} className="px-3 py-0.5 active:opacity-50">
        <Feather name="chevron-up" size={16} color={colors.inkMuted} />
      </Pressable>
      <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 24, letterSpacing: -0.5 }}>
        {children}
      </Text>
      <Pressable onPress={onDown} hitSlop={8} accessibilityLabel={`${label} down`} className="px-3 py-0.5 active:opacity-50">
        <Feather name="chevron-down" size={16} color={colors.inkMuted} />
      </Pressable>
    </View>
  );
}
