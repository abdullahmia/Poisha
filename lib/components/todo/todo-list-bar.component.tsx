import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import type React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import type { TTodo, TTodoList } from '@/lib/types';
import type { TTodoFilter } from '@/lib/utils/todo-view.util';

type TodoListBarProps = {
  lists: TTodoList[];
  todos: TTodo[];
  filter: TTodoFilter;
  onFilterChange: (next: TTodoFilter) => void;
  searchOpen: boolean;
};

/**
 * Counts show open todos only. A chip reading "Work 12" when all twelve are
 * finished would pull the user into an empty list.
 */
function openCountFor(todos: TTodo[], predicate: (todo: TTodo) => boolean): number {
  return todos.filter(t => !t.completed && predicate(t)).length;
}

export const TodoListBar: React.FC<TodoListBarProps> = ({
  lists,
  todos,
  filter,
  onFilterChange,
  searchOpen,
}) => {
  const { colors } = useTheme();

  function chip(key: string, label: string, count: number, color: string | null, emoji?: string) {
    const selected = filter.listId === key;
    const tint = color ?? colors.accent;

    return (
      <Pressable
        key={key}
        onPress={() => onFilterChange({ ...filter, listId: key })}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`${label}, ${count} open`}
        className="flex-row items-center gap-1.5 rounded-full border px-3.5 py-2 active:opacity-65"
        style={{
          borderColor: selected ? tint : colors.line,
          backgroundColor: selected ? `${tint}1f` : 'transparent',
        }}
      >
        {emoji ? <Text style={{ fontSize: 13 }}>{emoji}</Text> : null}
        <Text
          style={{
            fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_400Regular',
            fontSize: 13,
            letterSpacing: -0.1,
            color: selected ? tint : colors.inkSoft,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
        {count > 0 && (
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: 11,
              color: selected ? tint : colors.inkMuted,
              opacity: 0.8,
            }}
          >
            {count}
          </Text>
        )}
      </Pressable>
    );
  }

  return (
    <View>
      {searchOpen && (
        <View className="mx-6 mb-3 flex-row items-center rounded-2xl border border-line bg-surface-alt px-4 py-3">
          <Feather name="search" size={15} color={colors.inkMuted} />
          <TextInput
            value={filter.query}
            onChangeText={query => onFilterChange({ ...filter, query })}
            placeholder="Search todos…"
            placeholderTextColor={colors.inkMuted}
            autoCapitalize="none"
            autoFocus
            className="ml-2.5 flex-1 text-ink"
            style={{ fontSize: 14, fontFamily: 'Inter_400Regular' }}
          />
          {filter.query.length > 0 && (
            <Pressable
              onPress={() => onFilterChange({ ...filter, query: '' })}
              hitSlop={8}
              accessibilityLabel="Clear search"
            >
              <Feather name="x" size={15} color={colors.inkMuted} />
            </Pressable>
          )}
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
      >
        {chip('all', 'All', openCountFor(todos, () => true), null)}
        {chip('inbox', 'Inbox', openCountFor(todos, t => t.listId === null), null, '📥')}
        {lists.map(list =>
          chip(list.id, list.name, openCountFor(todos, t => t.listId === list.id), list.color, list.icon),
        )}

        {/* Managing lists lives in Settings, but this is where someone realises
            they want another one — so the door is here too. */}
        <Pressable
          onPress={() => router.push('/settings/todo-lists')}
          className="h-[38px] w-[38px] items-center justify-center rounded-full border border-dashed border-line active:opacity-60"
          accessibilityLabel="Manage lists"
        >
          <Feather name="plus" size={14} color={colors.inkMuted} />
        </Pressable>
      </ScrollView>
    </View>
  );
};
