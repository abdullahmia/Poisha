import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import type React from 'react';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import type { TTodoPrefsPatch } from '@/lib/services/todo';
import type {
  TTodoDensity,
  TTodoCompletedMode,
  TTodoGroupBy,
  TTodoPrefs,
  TTodoPriority,
  TTodoSortBy,
  TTodoTag,
} from '@/lib/types';
import { BottomSheet } from '@/lib/ui/bottom-sheet.ui';
import type { TTodoDueFilter, TTodoFilter } from '@/lib/utils/todo-view.util';
import { FieldLabel, SelectChip } from './todo-chip.component';

type TodoViewSheetProps = {
  visible: boolean;
  onClose: () => void;
  prefs: TTodoPrefs;
  onPrefsChange: (patch: TTodoPrefsPatch) => void;
  filter: TTodoFilter;
  onFilterChange: (next: TTodoFilter) => void;
  priorities: TTodoPriority[];
  tags: TTodoTag[];
  onClearCompleted: () => void;
  completedCount: number;
};

const SORTS: { value: TTodoSortBy; label: string }[] = [
  { value: 'manual', label: 'Manual' },
  { value: 'due', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'created', label: 'Created' },
  { value: 'alpha', label: 'A–Z' },
];

const GROUPS: { value: TTodoGroupBy; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'list', label: 'List' },
  { value: 'priority', label: 'Priority' },
  { value: 'due', label: 'Due date' },
  { value: 'tag', label: 'Tag' },
];

const COMPLETED: { value: TTodoCompletedMode; label: string }[] = [
  { value: 'bottom', label: 'In a section' },
  { value: 'show', label: 'Inline' },
  { value: 'hide', label: 'Hidden' },
];

const DENSITIES: { value: TTodoDensity; label: string }[] = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'compact', label: 'Compact' },
];

const DUE_FILTERS: { value: TTodoDueFilter; label: string }[] = [
  { value: 'all', label: 'Any' },
  { value: 'today', label: 'Due today' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'nodate', label: 'No date' },
];

/**
 * The in-context half of customization: what someone changes *while* looking at
 * their list. The durable, set-once preferences live in Settings › Todo, which
 * this links out to rather than duplicating.
 *
 * Sort/group/display write straight to prefs (they persist); the filter rows
 * are session state owned by the screen.
 */
export const TodoViewSheet: React.FC<TodoViewSheetProps> = ({
  visible,
  onClose,
  prefs,
  onPrefsChange,
  filter,
  onFilterChange,
  priorities,
  tags,
  onClearCompleted,
  completedCount,
}) => {
  const { colors } = useTheme();

  function togglePriority(id: string) {
    onFilterChange({
      ...filter,
      priorityIds: filter.priorityIds.includes(id)
        ? filter.priorityIds.filter(p => p !== id)
        : [...filter.priorityIds, id],
    });
  }

  function toggleTag(id: string) {
    onFilterChange({
      ...filter,
      tagIds: filter.tagIds.includes(id) ? filter.tagIds.filter(t => t !== id) : [...filter.tagIds, id],
    });
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} sheetStyle={{ maxHeight: Dimensions.get('window').height * 0.85 }}>
      {close => (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}
        >
          <Text className="mb-5 text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 18 }}>
            View options
          </Text>

          <FieldLabel>Sort by</FieldLabel>
          <View className="flex-row flex-wrap gap-2">
            {SORTS.map(sort => (
              <SelectChip
                key={sort.value}
                label={sort.label}
                selected={prefs.sortBy === sort.value}
                onPress={() => onPrefsChange({ sortBy: sort.value })}
              />
            ))}
          </View>

          {/* Manual order has no meaningful reverse — the order *is* the
              answer — so the direction control stays out of the way for it. */}
          {prefs.sortBy !== 'manual' && (
            <View className="mt-3 flex-row gap-2">
              <SelectChip
                label="Ascending"
                icon="arrow-up"
                selected={prefs.sortDir === 'asc'}
                onPress={() => onPrefsChange({ sortDir: 'asc' })}
              />
              <SelectChip
                label="Descending"
                icon="arrow-down"
                selected={prefs.sortDir === 'desc'}
                onPress={() => onPrefsChange({ sortDir: 'desc' })}
              />
            </View>
          )}

          <View className="pt-6">
            <FieldLabel>Group by</FieldLabel>
            <View className="flex-row flex-wrap gap-2">
              {GROUPS.map(group => (
                <SelectChip
                  key={group.value}
                  label={group.label}
                  selected={prefs.groupBy === group.value}
                  onPress={() => onPrefsChange({ groupBy: group.value })}
                />
              ))}
            </View>
          </View>

          <View className="pt-6">
            <FieldLabel>Completed todos</FieldLabel>
            <View className="flex-row flex-wrap gap-2">
              {COMPLETED.map(mode => (
                <SelectChip
                  key={mode.value}
                  label={mode.label}
                  selected={prefs.completedMode === mode.value}
                  onPress={() => onPrefsChange({ completedMode: mode.value })}
                />
              ))}
            </View>
          </View>

          <View className="pt-6">
            <FieldLabel>Density</FieldLabel>
            <View className="flex-row flex-wrap gap-2">
              {DENSITIES.map(density => (
                <SelectChip
                  key={density.value}
                  label={density.label}
                  selected={prefs.density === density.value}
                  onPress={() => onPrefsChange({ density: density.value })}
                />
              ))}
            </View>
          </View>

          <View className="my-6 h-px bg-line" />

          <FieldLabel>Show only</FieldLabel>
          <View className="flex-row flex-wrap gap-2">
            {DUE_FILTERS.map(due => (
              <SelectChip
                key={due.value}
                label={due.label}
                selected={filter.dueFilter === due.value}
                onPress={() => onFilterChange({ ...filter, dueFilter: due.value })}
              />
            ))}
          </View>

          {priorities.length > 0 && (
            <View className="pt-6">
              <FieldLabel
                action={
                  filter.priorityIds.length > 0
                    ? { label: 'Clear', onPress: () => onFilterChange({ ...filter, priorityIds: [] }) }
                    : undefined
                }
              >
                Priority
              </FieldLabel>
              <View className="flex-row flex-wrap gap-2">
                {priorities.map(priority => (
                  <SelectChip
                    key={priority.id}
                    label={priority.name}
                    color={priority.color}
                    icon="flag"
                    selected={filter.priorityIds.includes(priority.id)}
                    onPress={() => togglePriority(priority.id)}
                  />
                ))}
              </View>
            </View>
          )}

          {tags.length > 0 && (
            <View className="pt-6">
              <FieldLabel
                action={
                  filter.tagIds.length > 0
                    ? { label: 'Clear', onPress: () => onFilterChange({ ...filter, tagIds: [] }) }
                    : undefined
                }
              >
                Tags
              </FieldLabel>
              <View className="flex-row flex-wrap gap-2">
                {tags.map(tag => (
                  <SelectChip
                    key={tag.id}
                    label={`#${tag.name}`}
                    color={tag.color}
                    selected={filter.tagIds.includes(tag.id)}
                    onPress={() => toggleTag(tag.id)}
                  />
                ))}
              </View>
            </View>
          )}

          {completedCount > 0 && (
            <Pressable
              onPress={() => {
                onClearCompleted();
                close();
              }}
              className="mt-7 flex-row items-center justify-center gap-2 rounded-xl border border-line py-3 active:opacity-65"
              accessibilityLabel="Clear completed todos"
            >
              <Feather name="trash-2" size={14} color={colors.danger} />
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13.5, color: colors.danger }}>
                Clear {completedCount} completed
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => {
              close();
              router.push('/settings/todo');
            }}
            className="mt-2.5 flex-row items-center justify-center gap-2 py-3 active:opacity-60"
            accessibilityLabel="Open todo settings"
          >
            <Feather name="settings" size={13} color={colors.inkMuted} />
            <Text className="text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 13 }}>
              All Todo settings
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </BottomSheet>
  );
};
