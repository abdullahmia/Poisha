import { router } from 'expo-router';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FieldLabel, SelectChip } from '@/lib/components/todo/todo-chip.component';
import { TodoTimePicker } from '@/lib/components/todo/todo-time-picker.component';
import { TODO_REMINDER_OFFSETS } from '@/lib/constants';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { useTodo } from '@/lib/hooks/use-todo.hook';
import { useTodoPreferences } from '@/lib/hooks/use-todo-prefs.hook';
import { useTodoTaxonomy } from '@/lib/hooks/use-todo-taxonomy.hook';
import type { TTodoCardFields, TTodoSwipeAction } from '@/lib/types';
import { ConfirmModal } from '@/lib/ui/confirm-modal.ui';
import { formatTimeLabel } from '@/lib/utils/todo-view.util';
import { ScreenHeader } from '../shared/screen-header.component';
import { SettingsNavRow } from '../shared/settings-nav-row.component';
import { SettingsToggleRow } from '../shared/settings-toggle-row.component';

function GroupLabel({ title, description }: { title: string; description: string }) {
  return (
    <View className="pb-2 pt-7">
      <Text className="text-ink" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, letterSpacing: -0.1 }}>
        {title}
      </Text>
      <Text className="mt-1 text-ink-soft" style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 }}>
        {description}
      </Text>
    </View>
  );
}

const CARD_FIELDS: { key: keyof TTodoCardFields; label: string }[] = [
  { key: 'note', label: 'Note' },
  { key: 'dueDate', label: 'Due date' },
  { key: 'priority', label: 'Priority' },
  { key: 'list', label: 'List' },
  { key: 'tags', label: 'Tags' },
  { key: 'subtaskProgress', label: 'Step progress' },
];

const SWIPE_ACTIONS: { value: TTodoSwipeAction; label: string }[] = [
  { value: 'delete', label: 'Delete' },
  { value: 'complete', label: 'Complete' },
  { value: 'none', label: 'Nothing' },
];

/**
 * The durable half of customization — things set once and forgotten. What
 * changes while looking at the list (sort, grouping, density, filters) lives in
 * the Todo tab's own view sheet, which is where the effect is visible.
 */
export const TodoSettings: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { enabled, loading } = useTodo();
  const { prefs, setPrefs, resetPrefs } = useTodoPreferences();
  const { lists, priorities, tags } = useTodoTaxonomy();

  const [timeOpen, setTimeOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  // Reachable from the Settings list only while the feature is on, but a deep
  // link or a flag flipped in another tab can still land here.
  useEffect(() => {
    if (!loading && !enabled) router.back();
  }, [loading, enabled]);

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 40 + insets.bottom, paddingHorizontal: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Todo"
        subtitle="Shape the module around how you work. Nothing here deletes a todo."
      />

      <GroupLabel
        title="Your vocabulary"
        description="The lists, urgency bands and tags you describe a todo with."
      />
      <SettingsNavRow
        icon="folder"
        label="Lists"
        value={String(lists.length)}
        onPress={() => router.push('/settings/todo-lists')}
      />
      <View className="ml-7 h-px bg-line" />
      <SettingsNavRow
        icon="flag"
        label="Priorities"
        value={String(priorities.length)}
        onPress={() => router.push('/settings/todo-priorities')}
      />
      <View className="ml-7 h-px bg-line" />
      <SettingsNavRow
        icon="hash"
        label="Tags"
        value={String(tags.length)}
        onPress={() => router.push('/settings/todo-tags')}
      />

      <GroupLabel title="New todos" description="What a brand-new todo starts out as." />
      <FieldLabel>Default list</FieldLabel>
      <View className="flex-row flex-wrap gap-2">
        <SelectChip
          label="Inbox"
          selected={prefs.defaultListId === null}
          onPress={() => setPrefs({ defaultListId: null })}
        />
        {lists.map(list => (
          <SelectChip
            key={list.id}
            label={list.name}
            emoji={list.icon}
            color={list.color}
            selected={prefs.defaultListId === list.id}
            onPress={() => setPrefs({ defaultListId: list.id })}
          />
        ))}
      </View>

      {priorities.length > 0 && (
        <View className="pt-5">
          <FieldLabel>Default priority</FieldLabel>
          <View className="flex-row flex-wrap gap-2">
            <SelectChip
              label="None"
              selected={prefs.defaultPriorityId === null}
              onPress={() => setPrefs({ defaultPriorityId: null })}
            />
            {priorities.map(priority => (
              <SelectChip
                key={priority.id}
                label={priority.name}
                color={priority.color}
                icon="flag"
                selected={prefs.defaultPriorityId === priority.id}
                onPress={() => setPrefs({ defaultPriorityId: priority.id })}
              />
            ))}
          </View>
        </View>
      )}

      <GroupLabel
        title="Reminders"
        description="Used by any todo that has a due date but no time of its own."
      />
      <Pressable
        onPress={() => setTimeOpen(o => !o)}
        className="flex-row items-center justify-between py-4 active:opacity-60"
        accessibilityLabel="Default reminder time"
      >
        <Text className="text-ink" style={{ fontFamily: 'Inter_400Regular', fontSize: 15 }}>
          Default time
        </Text>
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.accent }}>
          {formatTimeLabel(prefs.defaultReminderTime)}
        </Text>
      </Pressable>
      {timeOpen && (
        <View className="pb-4">
          <TodoTimePicker
            value={prefs.defaultReminderTime}
            onChange={v => setPrefs({ defaultReminderTime: v })}
          />
        </View>
      )}

      <View className="h-px bg-line" />

      <View className="pt-4">
        <FieldLabel>Default reminder</FieldLabel>
        <View className="flex-row flex-wrap gap-2">
          <SelectChip
            label="None"
            selected={prefs.defaultReminderMinutesBefore === null}
            onPress={() => setPrefs({ defaultReminderMinutesBefore: null })}
          />
          {TODO_REMINDER_OFFSETS.map(offset => (
            <SelectChip
              key={offset.minutes}
              label={offset.label}
              selected={prefs.defaultReminderMinutesBefore === offset.minutes}
              onPress={() => setPrefs({ defaultReminderMinutesBefore: offset.minutes })}
            />
          ))}
        </View>
      </View>

      <GroupLabel title="On the card" description="Which details each todo shows in the list." />
      <View className="flex-row flex-wrap gap-2">
        {CARD_FIELDS.map(field => (
          <SelectChip
            key={field.key}
            label={field.label}
            icon={prefs.cardFields[field.key] ? 'check' : undefined}
            selected={prefs.cardFields[field.key]}
            onPress={() => setPrefs({ cardFields: { [field.key]: !prefs.cardFields[field.key] } })}
          />
        ))}
      </View>

      <View className="pt-3">
        <SettingsToggleRow
          label="Colour by list"
          description="Tint each todo with its list's colour instead of the app accent."
          value={prefs.colorByList}
          onValueChange={v => setPrefs({ colorByList: v })}
        />
        <View className="h-px bg-line" />
        <SettingsToggleRow
          label="Progress bar"
          description="Show how much of the current view is done, at the top of the tab."
          value={prefs.showProgressBar}
          onValueChange={v => setPrefs({ showProgressBar: v })}
        />
      </View>

      <GroupLabel title="Behaviour" description="How the list reacts to you." />
      <FieldLabel>Swiping a todo</FieldLabel>
      <View className="flex-row flex-wrap gap-2">
        {SWIPE_ACTIONS.map(action => (
          <SelectChip
            key={action.value}
            label={action.label}
            selected={prefs.swipeAction === action.value}
            onPress={() => setPrefs({ swipeAction: action.value })}
          />
        ))}
      </View>

      <View className="pt-3">
        <SettingsToggleRow
          label="Confirm before deleting"
          description="Ask first when a swipe would delete a todo."
          value={prefs.confirmDelete}
          onValueChange={v => setPrefs({ confirmDelete: v })}
          // With swipe set to Complete or Nothing there is no swipe-delete left
          // to confirm; the edit sheet's delete button asks regardless.
          disabled={prefs.swipeAction !== 'delete'}
        />
        <View className="h-px bg-line" />
        <SettingsToggleRow
          label="Carry overdue forward"
          description="Move unfinished past-due todos to today when you open the app."
          value={prefs.carryOverOverdue}
          onValueChange={v => setPrefs({ carryOverOverdue: v })}
        />
      </View>

      <Pressable
        onPress={() => setResetOpen(true)}
        className="mt-9 items-center rounded-xl border border-line py-3.5 active:opacity-65"
        accessibilityLabel="Reset todo settings"
      >
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: colors.danger }}>
          Reset to defaults
        </Text>
      </Pressable>

      <ConfirmModal
        visible={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset Todo settings?"
        message={
          'Every preference on this screen goes back to how it shipped, along with sorting, grouping and density.\n\nYour todos, lists, priorities and tags are untouched.'
        }
        icon="rotate-ccw"
        destructive
        actions={[
          { label: 'Cancel', variant: 'outline' },
          { label: 'Reset', variant: 'danger', onPress: resetPrefs },
        ]}
      />
    </ScrollView>
  );
};
