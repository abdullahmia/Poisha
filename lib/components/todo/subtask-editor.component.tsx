import { Feather } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import type React from 'react';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import type { TSubtask } from '@/lib/types';

type SubtaskEditorProps = {
  value: TSubtask[];
  onChange: (next: TSubtask[]) => void;
  tint: string;
};

export const SubtaskEditor: React.FC<SubtaskEditorProps> = ({ value, onChange, tint }) => {
  const { colors } = useTheme();
  const [draft, setDraft] = useState('');

  function add() {
    const title = draft.trim();
    if (!title) return;
    onChange([...value, { id: `sub_${Crypto.randomUUID()}`, title, done: false }]);
    // Cleared but not blurred, so a list can be typed in one run without
    // reaching for the field again between items.
    setDraft('');
  }

  function toggle(id: string) {
    onChange(value.map(s => (s.id === id ? { ...s, done: !s.done } : s)));
  }

  function remove(id: string) {
    onChange(value.filter(s => s.id !== id));
  }

  const done = value.filter(s => s.done).length;

  return (
    <View>
      {value.length > 0 && (
        <View className="mb-2 flex-row items-center gap-2">
          <View className="h-1 flex-1 overflow-hidden rounded-full bg-surface-alt">
            <View
              className="h-full rounded-full"
              style={{ width: `${(done / value.length) * 100}%`, backgroundColor: tint }}
            />
          </View>
          <Text className="text-ink-muted" style={{ fontFamily: 'Inter_500Medium', fontSize: 11 }}>
            {done}/{value.length}
          </Text>
        </View>
      )}

      {value.map(subtask => (
        <View key={subtask.id} className="flex-row items-center gap-2.5 py-1.5">
          <Pressable
            onPress={() => toggle(subtask.id)}
            hitSlop={8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: subtask.done }}
            accessibilityLabel={subtask.title}
            className="h-5 w-5 items-center justify-center rounded-md border-2"
            style={{
              borderColor: subtask.done ? tint : colors.line,
              backgroundColor: subtask.done ? tint : 'transparent',
            }}
          >
            {subtask.done && <Feather name="check" size={11} color="#ffffff" />}
          </Pressable>

          <Text
            className={subtask.done ? 'flex-1 text-ink-muted' : 'flex-1 text-ink'}
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 14,
              textDecorationLine: subtask.done ? 'line-through' : 'none',
            }}
            numberOfLines={2}
          >
            {subtask.title}
          </Text>

          <Pressable
            onPress={() => remove(subtask.id)}
            hitSlop={8}
            accessibilityLabel={`Remove ${subtask.title}`}
            className="active:opacity-50"
          >
            <Feather name="x" size={15} color={colors.inkMuted} />
          </Pressable>
        </View>
      ))}

      <View className="mt-1.5 flex-row items-center gap-2 rounded-xl border border-line bg-bg px-3 py-2.5">
        <Feather name="plus" size={14} color={colors.inkMuted} />
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
          placeholder="Add a step…"
          placeholderTextColor={colors.inkMuted}
          returnKeyType="done"
          blurOnSubmit={false}
          className="flex-1 text-ink"
          style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }}
        />
        {draft.trim().length > 0 && (
          <Pressable onPress={add} hitSlop={8} accessibilityLabel="Add step" className="active:opacity-60">
            <Feather name="corner-down-left" size={14} color={colors.accent} />
          </Pressable>
        )}
      </View>
    </View>
  );
};
