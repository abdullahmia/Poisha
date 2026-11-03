import { Feather } from '@expo/vector-icons';
import { clsx } from 'clsx';
import type React from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { TODO_REMINDER_OFFSETS } from '@/lib/constants';
import { useTodoForm } from '@/lib/hooks/use-todo-form.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import type { TTodo, TTodoDraft, TTodoList, TTodoPrefs, TTodoPriority, TTodoTag } from '@/lib/types';
import { BottomSheet } from '@/lib/ui/bottom-sheet.ui';
import { DatePicker } from '@/lib/ui/date-picker.ui';
import { dateToISO, isoToDate, todayISO } from '@/lib/utils/date.util';
import { formatDueLabel, formatTimeLabel } from '@/lib/utils/todo-view.util';
import { SubtaskEditor } from './subtask-editor.component';
import { FieldLabel, SelectChip } from './todo-chip.component';
import { TodoRepeatEditor } from './todo-repeat-editor.component';
import { TodoTimePicker } from './todo-time-picker.component';

type TodoFormSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Null when adding. */
  todo: TTodo | null;
  prefs: TTodoPrefs;
  lists: TTodoList[];
  priorities: TTodoPriority[];
  tags: TTodoTag[];
  onSave: (draft: TTodoDraft) => void;
  onDelete: (id: string) => void;
};

function shiftToday(days: number): string {
  const d = isoToDate(todayISO());
  d.setDate(d.getDate() + days);
  return dateToISO(d);
}

export const TodoFormSheet: React.FC<TodoFormSheetProps> = ({
  visible,
  onClose,
  todo,
  prefs,
  lists,
  priorities,
  tags,
  onSave,
  onDelete,
}) => {
  const { colors } = useTheme();
  const { state, set, setDueDate, toggleTag, canSave, toDraft } = useTodoForm(todo, prefs, visible);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  // Everything past the essentials starts folded away. Adding a todo should be
  // "type it and hit save"; the depth is there for the ones that need it.
  const [moreOpen, setMoreOpen] = useState(false);

  const activeList = state.listId ? lists.find(l => l.id === state.listId) ?? null : null;
  const tint = prefs.colorByList && activeList ? activeList.color : colors.accent;

  const today = todayISO();

  function handleSave() {
    if (!canSave) return;
    onSave(toDraft(todo));
    onClose();
  }

  function closeAll() {
    setCalendarOpen(false);
    setTimeOpen(false);
    setMoreOpen(false);
    onClose();
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={closeAll}
      keyboardAvoiding
      // A definite minHeight is what lets the `flex-1` body below resolve —
      // against an auto-height sheet the ScrollView would collapse to nothing.
      // Same pairing the add-entry sheet uses.
      sheetStyle={{ minHeight: '80%' as unknown as number, maxHeight: '94%' as unknown as number }}
    >
      {() => (
        <View className="flex-1">
          <View className="flex-row items-center justify-between px-6 pb-3 pt-4">
            <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 18 }}>
              {todo ? 'Edit Todo' : 'New Todo'}
            </Text>
            {todo && (
              <Pressable
                onPress={() => {
                  onDelete(todo.id);
                  closeAll();
                }}
                hitSlop={8}
                accessibilityLabel="Delete todo"
                className="h-8 w-8 items-center justify-center rounded-full bg-danger-soft active:opacity-70"
              >
                <Feather name="trash-2" size={14} color={colors.danger} />
              </Pressable>
            )}
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 8 }}
          >
            <TextInput
              value={state.title}
              onChangeText={v => set('title', v)}
              placeholder="What needs doing?"
              placeholderTextColor={colors.inkMuted}
              autoFocus={!todo}
              multiline
              className="rounded-xl border border-line bg-bg px-4 py-3 text-ink"
              style={{ fontFamily: 'Inter_500Medium', fontSize: 16, minHeight: 48 }}
            />

            <View className="h-3" />

            <TextInput
              value={state.note}
              onChangeText={v => set('note', v)}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.inkMuted}
              multiline
              className="rounded-xl border border-line bg-bg px-4 py-3 text-ink"
              style={{ fontFamily: 'Inter_400Regular', fontSize: 14, minHeight: 56 }}
            />

            {/* ── Due date ─────────────────────────────────────────────── */}
            <View className="pt-5">
              <FieldLabel
                action={state.dueDate ? { label: 'Clear', onPress: () => setDueDate(null) } : undefined}
              >
                Due
              </FieldLabel>
              <View className="flex-row flex-wrap gap-2">
                <SelectChip
                  label="Today"
                  selected={state.dueDate === today}
                  onPress={() => setDueDate(today)}
                />
                <SelectChip
                  label="Tomorrow"
                  selected={state.dueDate === shiftToday(1)}
                  onPress={() => setDueDate(shiftToday(1))}
                />
                <SelectChip
                  label="Next week"
                  selected={state.dueDate === shiftToday(7)}
                  onPress={() => setDueDate(shiftToday(7))}
                />
                <SelectChip
                  label={
                    state.dueDate && ![today, shiftToday(1), shiftToday(7)].includes(state.dueDate)
                      ? formatDueLabel(state.dueDate, today)
                      : 'Pick a date'
                  }
                  icon="calendar"
                  selected={calendarOpen}
                  onPress={() => setCalendarOpen(o => !o)}
                />
              </View>

              {calendarOpen && (
                <View className="mt-3 overflow-hidden rounded-xl border border-line bg-bg py-3">
                  {/* No maximumDate — unlike an expense, a todo's whole point
                      can be that it sits in the future. */}
                  <DatePicker value={state.dueDate ?? today} onChange={setDueDate} />
                </View>
              )}
            </View>

            {/* Time and reminder are only reachable once a date exists, since
                both are offsets from it. */}
            {state.dueDate && (
              <View className="pt-5">
                <FieldLabel
                  action={state.dueTime ? { label: 'Clear time', onPress: () => set('dueTime', null) } : undefined}
                >
                  Time &amp; reminder
                </FieldLabel>

                <View className="flex-row flex-wrap gap-2">
                  <SelectChip
                    label={state.dueTime ? formatTimeLabel(state.dueTime) ?? 'Set time' : 'Set time'}
                    icon="clock"
                    selected={timeOpen || state.dueTime !== null}
                    onPress={() => {
                      if (!state.dueTime) set('dueTime', prefs.defaultReminderTime);
                      setTimeOpen(o => !o);
                    }}
                  />
                </View>

                {timeOpen && (
                  <View className="mt-3">
                    <TodoTimePicker
                      value={state.dueTime ?? prefs.defaultReminderTime}
                      onChange={v => set('dueTime', v)}
                    />
                  </View>
                )}

                <View className="mt-3 flex-row flex-wrap gap-2">
                  <SelectChip
                    label="No reminder"
                    selected={state.reminderMinutesBefore === null}
                    onPress={() => set('reminderMinutesBefore', null)}
                  />
                  {TODO_REMINDER_OFFSETS.map(offset => (
                    <SelectChip
                      key={offset.minutes}
                      label={offset.label}
                      selected={state.reminderMinutesBefore === offset.minutes}
                      onPress={() => set('reminderMinutesBefore', offset.minutes)}
                    />
                  ))}
                </View>

                {state.reminderMinutesBefore !== null && !state.dueTime && (
                  <Text className="mt-2 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 11.5 }}>
                    No time set — the reminder uses your default of{' '}
                    {formatTimeLabel(prefs.defaultReminderTime)}.
                  </Text>
                )}
              </View>
            )}

            {/* ── List ─────────────────────────────────────────────────── */}
            <View className="pt-5">
              <FieldLabel>List</FieldLabel>
              <View className="flex-row flex-wrap gap-2">
                <SelectChip label="Inbox" selected={state.listId === null} onPress={() => set('listId', null)} />
                {lists.map(list => (
                  <SelectChip
                    key={list.id}
                    label={list.name}
                    emoji={list.icon}
                    color={list.color}
                    selected={state.listId === list.id}
                    onPress={() => set('listId', list.id)}
                  />
                ))}
              </View>
            </View>

            {/* ── Priority ─────────────────────────────────────────────── */}
            {priorities.length > 0 && (
              <View className="pt-5">
                <FieldLabel>Priority</FieldLabel>
                <View className="flex-row flex-wrap gap-2">
                  <SelectChip
                    label="None"
                    selected={state.priorityId === null}
                    onPress={() => set('priorityId', null)}
                  />
                  {priorities.map(priority => (
                    <SelectChip
                      key={priority.id}
                      label={priority.name}
                      color={priority.color}
                      icon="flag"
                      selected={state.priorityId === priority.id}
                      onPress={() => set('priorityId', priority.id)}
                    />
                  ))}
                </View>
              </View>
            )}

            {moreOpen ? (
              <>
                {tags.length > 0 && (
                  <View className="pt-5">
                    <FieldLabel>Tags</FieldLabel>
                    <View className="flex-row flex-wrap gap-2">
                      {tags.map(tag => (
                        <SelectChip
                          key={tag.id}
                          label={`#${tag.name}`}
                          color={tag.color}
                          selected={state.tagIds.includes(tag.id)}
                          onPress={() => toggleTag(tag.id)}
                        />
                      ))}
                    </View>
                  </View>
                )}

                <View className="pt-5">
                  <FieldLabel>Steps</FieldLabel>
                  <SubtaskEditor value={state.subtasks} onChange={v => set('subtasks', v)} tint={tint} />
                </View>

                {state.dueDate && (
                  <View className="pt-5">
                    <TodoRepeatEditor value={state.repeat} onChange={v => set('repeat', v)} />
                  </View>
                )}
              </>
            ) : (
              <Pressable
                onPress={() => setMoreOpen(true)}
                className="mt-5 flex-row items-center justify-center gap-2 rounded-xl border border-line py-3 active:opacity-65"
                accessibilityLabel="Show more options"
              >
                <Feather name="sliders" size={14} color={colors.inkSoft} />
                <Text className="text-ink-soft" style={{ fontFamily: 'Inter_500Medium', fontSize: 13.5 }}>
                  Tags, steps &amp; repeat
                </Text>
              </Pressable>
            )}

            <View className="h-5" />
          </ScrollView>

          <View className="border-t border-line px-6 pb-1 pt-3">
            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              className={clsx('items-center rounded-xl py-3.5', canSave ? '' : 'bg-surface-alt')}
              style={canSave ? { backgroundColor: tint } : undefined}
              accessibilityLabel="Save todo"
            >
              <Text
                className={canSave ? 'text-white' : 'text-ink-muted'}
                style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15 }}
              >
                {todo ? 'Save Changes' : 'Add Todo'}
              </Text>
            </Pressable>
            <Pressable onPress={closeAll} className="items-center py-3" accessibilityLabel="Cancel">
              <Text className="text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </BottomSheet>
  );
};
