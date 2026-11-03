import { Feather } from '@expo/vector-icons';
import { clsx } from 'clsx';
import type React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import type { TTodo, TTodoList, TTodoPrefs, TTodoPriority, TTodoTag } from '@/lib/types';
import { formatDueLabel, formatTimeLabel, isOverdue } from '@/lib/utils/todo-view.util';
import { TodoCheckbox } from './todo-checkbox.component';

type TodoItemCardProps = {
  todo: TTodo;
  prefs: TTodoPrefs;
  lists: TTodoList[];
  priorities: TTodoPriority[];
  tags: TTodoTag[];
  today: string;
  onToggle: (id: string) => void;
  onPress: (todo: TTodo) => void;
};

function MetaChip({ label, color, icon }: { label: string; color: string; icon?: keyof typeof Feather.glyphMap }) {
  return (
    <View
      className="flex-row items-center gap-1 rounded-md px-1.5 py-0.5"
      style={{ backgroundColor: `${color}1f` }}
    >
      {icon && <Feather name={icon} size={9.5} color={color} />}
      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10.5, color, letterSpacing: -0.1 }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export const TodoItemCard: React.FC<TodoItemCardProps> = ({
  todo,
  prefs,
  lists,
  priorities,
  tags,
  today,
  onToggle,
  onPress,
}) => {
  const { colors } = useTheme();

  const list = todo.listId ? lists.find(l => l.id === todo.listId) ?? null : null;
  const priority = todo.priorityId ? priorities.find(p => p.id === todo.priorityId) ?? null : null;
  const todoTags = prefs.cardFields.tags ? tags.filter(t => todo.tagIds.includes(t.id)) : [];

  // One colour decides the checkbox tint and the left edge stripe. The list is
  // the user's own grouping, so it wins when they've asked for it; the accent
  // is the fallback, and Inbox todos always fall back.
  const tint = prefs.colorByList && list ? list.color : colors.accent;

  const overdue = isOverdue(todo, today);
  const compact = prefs.density === 'compact';

  const doneSubtasks = todo.subtasks.filter(s => s.done).length;
  const showSubtasks = prefs.cardFields.subtaskProgress && todo.subtasks.length > 0;
  const timeLabel = formatTimeLabel(todo.dueTime);

  const hasMeta =
    (prefs.cardFields.dueDate && todo.dueDate !== null) ||
    (prefs.cardFields.priority && priority !== null) ||
    (prefs.cardFields.list && list !== null) ||
    todoTags.length > 0 ||
    showSubtasks ||
    todo.repeat !== null;

  return (
    <Pressable
      onPress={() => onPress(todo)}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${todo.title}`}
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
      className={clsx('mb-2 overflow-hidden rounded-[16px] border border-line bg-surface', compact ? 'px-3' : 'px-3.5')}
    >
      {/* Stripe only when a list is actually driving the colour — on an Inbox
          todo it would be an accent bar that means nothing. */}
      {prefs.colorByList && list && (
        <View className="absolute bottom-0 left-0 top-0 w-[3px]" style={{ backgroundColor: list.color }} />
      )}

      <View className={clsx('flex-row items-start gap-3', compact ? 'py-2.5' : 'py-3.5')}>
        <View className={compact ? 'pt-px' : 'pt-0.5'}>
          <TodoCheckbox
            checked={todo.completed}
            color={tint}
            size={compact ? 20 : 23}
            onPress={() => onToggle(todo.id)}
            accessibilityLabel={todo.completed ? `Mark ${todo.title} as not done` : `Mark ${todo.title} as done`}
          />
        </View>

        <View className="min-w-0 flex-1">
          <Text
            className={clsx(todo.completed ? 'text-ink-muted' : 'text-ink')}
            style={{
              fontFamily: 'Inter_500Medium',
              fontSize: compact ? 14 : 15,
              letterSpacing: -0.2,
              lineHeight: compact ? 19 : 21,
              textDecorationLine: todo.completed ? 'line-through' : 'none',
            }}
            numberOfLines={compact ? 1 : 2}
          >
            {todo.title}
          </Text>

          {prefs.cardFields.note && todo.note.trim().length > 0 && !compact && (
            <Text
              className="mt-1 text-ink-muted"
              style={{ fontFamily: 'Inter_400Regular', fontSize: 12.5, lineHeight: 17 }}
              numberOfLines={2}
            >
              {todo.note.trim()}
            </Text>
          )}

          {hasMeta && (
            <View className={clsx('flex-row flex-wrap items-center gap-1.5', compact ? 'mt-1' : 'mt-2')}>
              {prefs.cardFields.dueDate && todo.dueDate && (
                <MetaChip
                  // Overdue is the one state that overrides the user's colour
                  // choices — a missed deadline has to read as a problem.
                  color={overdue ? colors.danger : colors.inkSoft}
                  icon="calendar"
                  label={`${formatDueLabel(todo.dueDate, today)}${timeLabel ? ` · ${timeLabel}` : ''}`}
                />
              )}
              {todo.repeat !== null && <MetaChip color={colors.inkSoft} icon="repeat" label="Repeats" />}
              {prefs.cardFields.priority && priority && (
                <MetaChip color={priority.color} icon="flag" label={priority.name} />
              )}
              {prefs.cardFields.list && list && <MetaChip color={list.color} label={`${list.icon} ${list.name}`} />}
              {todoTags.map(tag => (
                <MetaChip key={tag.id} color={tag.color} label={`#${tag.name}`} />
              ))}
              {showSubtasks && (
                <MetaChip
                  color={doneSubtasks === todo.subtasks.length ? colors.inkSoft : tint}
                  icon="check-square"
                  label={`${doneSubtasks}/${todo.subtasks.length}`}
                />
              )}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};
