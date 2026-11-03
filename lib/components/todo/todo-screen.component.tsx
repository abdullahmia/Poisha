import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHaptics } from '@/lib/hooks/use-haptics.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { useTodoPreferences } from '@/lib/hooks/use-todo-prefs.hook';
import { useTodos } from '@/lib/hooks/use-todos.hook';
import type { TTodo } from '@/lib/types';
import { ConfirmModal } from '@/lib/ui/confirm-modal.ui';
import { EMPTY_TODO_FILTER, isFilterActive, type TTodoFilter } from '@/lib/utils/todo-view.util';
import { SwipeableTodoCard } from './swipeable-todo-card.component';
import { TodoEmptyState } from './todo-empty-state.component';
import { TodoFormSheet } from './todo-form-sheet.component';
import { TodoHeader } from './todo-header.component';
import { TodoListBar } from './todo-list-bar.component';
import { TodoViewSheet } from './todo-view-sheet.component';

/**
 * Groups and their rows are flattened into one list rather than rendered as a
 * SectionList: tag grouping puts the same todo under several headers, so a
 * section's items are not a partition of the data and the keys have to carry
 * their group to stay unique.
 */
type TRow =
  | { kind: 'header'; key: string; label: string; color: string | null; count: number }
  | { kind: 'todo'; key: string; todo: TTodo }
  | { kind: 'completedHeader'; key: string; count: number };

export const TodoScreen: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { impact, notification } = useHaptics();
  const { setPrefs } = useTodoPreferences();

  const [filter, setFilter] = useState<TTodoFilter>(EMPTY_TODO_FILTER);
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TTodo | null>(null);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const { view, prefs, lists, priorities, tags, today, todos, saveTodo, toggleTodo, deleteTodo, clearCompleted } =
    useTodos(filter);

  const openCardId = useSharedValue<string | null>(null);

  // "Clear completed" deletes every finished todo, not just the ones the
  // current filter happens to show — so the count offered must be the total,
  // or the confirmation would understate what is about to be deleted.
  const completedTotal = useMemo(() => todos.filter(t => t.completed).length, [todos]);

  const rows = useMemo<TRow[]>(() => {
    const out: TRow[] = [];

    for (const group of view.groups) {
      // 'none' grouping yields a single unlabelled group — no header to draw.
      if (group.label) {
        out.push({
          kind: 'header',
          key: `h_${group.key}`,
          label: group.label,
          color: group.color,
          count: group.todos.length,
        });
      }
      for (const todo of group.todos) {
        out.push({ kind: 'todo', key: `${group.key}_${todo.id}`, todo });
      }
    }

    if (view.completed.length > 0) {
      out.push({ kind: 'completedHeader', key: 'completed_header', count: view.completed.length });
      if (completedOpen) {
        for (const todo of view.completed) out.push({ kind: 'todo', key: `done_${todo.id}`, todo });
      }
    }

    return out;
  }, [view, completedOpen]);

  const handleToggle = useCallback(
    (id: string) => {
      notification(Haptics.NotificationFeedbackType.Success);
      toggleTodo(id);
    },
    [notification, toggleTodo],
  );

  const handleEdit = useCallback((todo: TTodo) => {
    setEditing(todo);
    setFormOpen(true);
  }, []);

  function openAdd() {
    impact(Haptics.ImpactFeedbackStyle.Medium);
    setEditing(null);
    setFormOpen(true);
  }

  function handleToggleSearch() {
    setSearchOpen(open => {
      // Closing the field must drop the query with it, or the list stays
      // filtered by text the user can no longer see.
      if (open) setFilter(f => ({ ...f, query: '' }));
      return !open;
    });
  }

  const renderItem = useCallback(
    ({ item }: { item: TRow }) => {
      if (item.kind === 'header') {
        return (
          <View className="flex-row items-center gap-2 px-6 pb-2 pt-5">
            {item.color && (
              <View className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            )}
            <Text
              className="text-ink"
              style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 15, letterSpacing: -0.2 }}
            >
              {item.label}
            </Text>
            <Text className="text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 12 }}>
              {item.count}
            </Text>
          </View>
        );
      }

      if (item.kind === 'completedHeader') {
        return (
          <Pressable
            onPress={() => setCompletedOpen(o => !o)}
            className="mx-6 mt-5 flex-row items-center gap-2 rounded-xl border border-line px-3.5 py-2.5 active:opacity-65"
            accessibilityLabel={completedOpen ? 'Hide completed' : 'Show completed'}
          >
            <Feather name={completedOpen ? 'chevron-down' : 'chevron-right'} size={14} color={colors.inkMuted} />
            <Text className="flex-1 text-ink-soft" style={{ fontFamily: 'Inter_500Medium', fontSize: 13 }}>
              Completed
            </Text>
            <Text className="text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 12 }}>
              {item.count}
            </Text>
          </Pressable>
        );
      }

      return (
        <View className="px-5">
          <SwipeableTodoCard
            todo={item.todo}
            prefs={prefs}
            lists={lists}
            priorities={priorities}
            tags={tags}
            today={today}
            openCardId={openCardId}
            onToggle={handleToggle}
            onDelete={deleteTodo}
            onPress={handleEdit}
          />
        </View>
      );
    },
    [prefs, lists, priorities, tags, today, openCardId, handleToggle, deleteTodo, handleEdit, completedOpen, colors],
  );

  return (
    <View className="flex-1 bg-bg">
      <FlatList
        data={rows}
        keyExtractor={row => row.key}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // flexGrow so the empty state claims the space under the header and
        // centres in it, instead of hugging the top with a void beneath.
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top, paddingBottom: 130 + insets.bottom }}
        ListHeaderComponent={
          <View style={{ paddingBottom: 10 }}>
            <TodoHeader
              view={view}
              showProgressBar={prefs.showProgressBar}
              searchOpen={searchOpen}
              filterActive={isFilterActive(filter)}
              onToggleSearch={handleToggleSearch}
              onOpenViewOptions={() => setViewSheetOpen(true)}
            />
            <View className="pt-5">
              <TodoListBar
                lists={lists}
                todos={todos}
                filter={filter}
                onFilterChange={setFilter}
                searchOpen={searchOpen}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <TodoEmptyState
            filtered={isFilterActive(filter)}
            onAdd={openAdd}
            onClearFilters={() => {
              setFilter(EMPTY_TODO_FILTER);
              setSearchOpen(false);
            }}
          />
        }
      />

      <Pressable
        onPress={openAdd}
        accessibilityRole="button"
        accessibilityLabel="Add a todo"
        className="absolute right-6 h-14 w-14 items-center justify-center rounded-full bg-accent active:opacity-85"
        style={{
          bottom: 110 + insets.bottom,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <Feather name="plus" size={24} color="#ffffff" />
      </Pressable>

      <TodoFormSheet
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        todo={editing}
        prefs={prefs}
        lists={lists}
        priorities={priorities}
        tags={tags}
        onSave={saveTodo}
        onDelete={deleteTodo}
      />

      <TodoViewSheet
        visible={viewSheetOpen}
        onClose={() => setViewSheetOpen(false)}
        prefs={prefs}
        onPrefsChange={setPrefs}
        filter={filter}
        onFilterChange={setFilter}
        priorities={priorities}
        tags={tags}
        onClearCompleted={() => setClearConfirmOpen(true)}
        completedCount={completedTotal}
      />

      <ConfirmModal
        visible={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        title="Clear completed?"
        message={`${completedTotal} completed ${completedTotal === 1 ? 'todo' : 'todos'} will be deleted.\n\nThis cannot be undone.`}
        icon="trash-2"
        destructive
        actions={[
          { label: 'Cancel', variant: 'outline' },
          { label: 'Clear', variant: 'danger', onPress: clearCompleted },
        ]}
      />
    </View>
  );
};
