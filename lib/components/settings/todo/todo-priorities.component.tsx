import { Feather } from '@expo/vector-icons';
import { clsx } from 'clsx';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLOR_SWATCHES } from '@/lib/components/settings/categories/category-form-sheet.component';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { useTodo } from '@/lib/hooks/use-todo.hook';
import { useTodoTaxonomy } from '@/lib/hooks/use-todo-taxonomy.hook';
import type { TTodoPriority } from '@/lib/types';
import { BottomSheet } from '@/lib/ui/bottom-sheet.ui';
import { Card } from '@/lib/ui/card.ui';
import { ConfirmModal } from '@/lib/ui/confirm-modal.ui';
import { ReorderButtons, TaxonomyHeader } from './todo-taxonomy-shared.component';

const MAX_LEVEL = 9;

export const TodoPriorities: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { enabled, loading } = useTodo();
  const { priorities, savePriority, deletePriority, reorderPriorities } = useTodoTaxonomy();

  useEffect(() => {
    if (!loading && !enabled) router.back();
  }, [loading, enabled]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TTodoPriority | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_SWATCHES[0]);
  const [level, setLevel] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<TTodoPriority | null>(null);

  function openAdd() {
    setEditing(null);
    setName('');
    setColor(COLOR_SWATCHES[priorities.length % COLOR_SWATCHES.length]);
    setLevel(1);
    setFormOpen(true);
  }

  function openEdit(priority: TTodoPriority) {
    setEditing(priority);
    setName(priority.name);
    setColor(priority.color);
    setLevel(priority.level);
    setFormOpen(true);
  }

  function handleSave() {
    if (!name.trim()) return;
    savePriority({
      id: editing?.id ?? `todo_pri_${Crypto.randomUUID()}`,
      name: name.trim(),
      color,
      level,
      sortOrder: editing?.sortOrder ?? priorities.length,
    });
    setFormOpen(false);
  }

  function move(priority: TTodoPriority, dir: -1 | 1) {
    const index = priorities.findIndex(p => p.id === priority.id);
    const swap = index + dir;
    if (index === -1 || swap < 0 || swap >= priorities.length) return;
    const next = [...priorities];
    [next[index], next[swap]] = [next[swap], next[index]];
    reorderPriorities(next.map(p => p.id));
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <TaxonomyHeader
        title="Priorities"
        subtitle={priorities.length > 0 ? `${priorities.length} levels` : undefined}
        onAdd={openAdd}
        addLabel="Add priority"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24 + insets.bottom }}
      >
        <Text
          className="mb-4 px-1 text-ink-muted"
          style={{ fontFamily: 'Inter_400Regular', fontSize: 12.5, lineHeight: 18 }}
        >
          Urgency decides sorting; the order below decides where each one appears in pickers. Rename or recolour
          freely — the urgency number is what sorting actually reads.
        </Text>

        {priorities.length === 0 ? (
          <View className="items-center py-16">
            <View className="mb-5 h-16 w-16 items-center justify-center rounded-full border border-line bg-surface">
              <Feather name="flag" size={22} color={colors.inkMuted} />
            </View>
            <Text className="text-ink-soft" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 17 }}>
              No priorities
            </Text>
            <Text
              className="mt-1.5 max-w-[250px] text-center text-ink-muted"
              style={{ fontSize: 12.5, fontFamily: 'Inter_400Regular', lineHeight: 18 }}
            >
              Without any, todos simply have no priority — which is a perfectly good way to work.
            </Text>
          </View>
        ) : (
          priorities.map((priority, index) => (
            <Pressable
              key={priority.id}
              onPress={() => openEdit(priority)}
              className="mb-3"
              style={({ pressed }) => (pressed ? { opacity: 0.75, transform: [{ scale: 0.99 }] } : undefined)}
              accessibilityLabel={`Edit ${priority.name}`}
            >
              <Card shadow className="relative flex-row items-center gap-3 overflow-hidden border-0 p-3.5" style={{ shadowOpacity: 0.14 }}>
                <View className="absolute bottom-0 left-0 top-0 w-[3px]" style={{ backgroundColor: priority.color }} />

                <View
                  className="h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${priority.color}1f`, borderWidth: 1, borderColor: `${priority.color}55` }}
                >
                  <Feather name="flag" size={17} color={priority.color} />
                </View>

                <View className="min-w-0 flex-1">
                  <Text
                    className="text-ink"
                    style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14.5, letterSpacing: -0.1 }}
                    numberOfLines={1}
                  >
                    {priority.name}
                  </Text>
                  <Text className="mt-0.5 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 11.5 }}>
                    Urgency {priority.level}
                  </Text>
                </View>

                <ReorderButtons
                  isFirst={index === 0}
                  isLast={index === priorities.length - 1}
                  onUp={() => move(priority, -1)}
                  onDown={() => move(priority, 1)}
                />

                <Pressable
                  onPress={e => {
                    e.stopPropagation();
                    setDeleteTarget(priority);
                  }}
                  hitSlop={6}
                  className="h-8 w-8 items-center justify-center rounded-full bg-danger-soft active:opacity-70"
                  accessibilityLabel={`Remove ${priority.name}`}
                >
                  <Feather name="trash-2" size={14} color={colors.danger} />
                </Pressable>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>

      <BottomSheet visible={formOpen} onClose={() => setFormOpen(false)} keyboardAvoiding>
        {() => (
          <View className="p-6">
            <Text className="mb-5 text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 18 }}>
              {editing ? 'Edit Priority' : 'New Priority'}
            </Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Priority name"
              placeholderTextColor={colors.inkMuted}
              autoFocus
              className="mb-4 rounded-[10px] border border-line bg-bg px-4 py-3 text-ink"
              style={{ fontFamily: 'Inter_400Regular', fontSize: 15 }}
            />

            <Text
              className="mb-2 uppercase text-ink-muted"
              style={{ fontFamily: 'Inter_500Medium', fontSize: 10, letterSpacing: 1.5 }}
            >
              Urgency
            </Text>
            <View className="mb-4 flex-row items-center justify-between rounded-xl border border-line bg-bg px-4 py-3">
              <Text className="text-ink-soft" style={{ fontFamily: 'Inter_400Regular', fontSize: 13 }}>
                Higher sorts first
              </Text>
              <View className="flex-row items-center gap-3">
                <Pressable
                  onPress={() => setLevel(l => Math.max(0, l - 1))}
                  disabled={level <= 0}
                  hitSlop={6}
                  className="h-7 w-7 items-center justify-center rounded-lg bg-surface-alt"
                  style={level <= 0 ? { opacity: 0.3 } : undefined}
                  accessibilityLabel="Decrease urgency"
                >
                  <Feather name="minus" size={14} color={colors.inkSoft} />
                </Pressable>
                <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 17, minWidth: 18, textAlign: 'center' }}>
                  {level}
                </Text>
                <Pressable
                  onPress={() => setLevel(l => Math.min(MAX_LEVEL, l + 1))}
                  disabled={level >= MAX_LEVEL}
                  hitSlop={6}
                  className="h-7 w-7 items-center justify-center rounded-lg bg-surface-alt"
                  style={level >= MAX_LEVEL ? { opacity: 0.3 } : undefined}
                  accessibilityLabel="Increase urgency"
                >
                  <Feather name="plus" size={14} color={colors.inkSoft} />
                </Pressable>
              </View>
            </View>

            <Text
              className="mb-2 uppercase text-ink-muted"
              style={{ fontFamily: 'Inter_500Medium', fontSize: 10, letterSpacing: 1.5 }}
            >
              Color
            </Text>
            <View className="mb-5 flex-row flex-wrap gap-2.5">
              {COLOR_SWATCHES.map(swatch => (
                <Pressable
                  key={swatch}
                  onPress={() => setColor(swatch)}
                  className="h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: swatch, borderWidth: color === swatch ? 2 : 0, borderColor: colors.ink }}
                  accessibilityLabel={`Choose colour ${swatch}`}
                >
                  {color === swatch && <Feather name="check" size={14} color="#ffffff" />}
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleSave}
              disabled={!name.trim()}
              className={clsx('mb-2.5 items-center rounded-[10px] py-3.5', name.trim() ? 'bg-accent' : 'bg-surface-alt')}
            >
              <Text
                className={name.trim() ? 'text-white' : 'text-ink-muted'}
                style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15 }}
              >
                Save
              </Text>
            </Pressable>
            <Pressable onPress={() => setFormOpen(false)} className="items-center py-3">
              <Text className="text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        )}
      </BottomSheet>

      <ConfirmModal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove Priority"
        message={`Todos marked "${deleteTarget?.name}" keep everything else and simply lose their priority. None are deleted.`}
        icon="trash-2"
        destructive
        actions={[
          { label: 'Cancel', variant: 'outline' },
          {
            label: 'Remove',
            variant: 'danger',
            onPress: () => {
              if (deleteTarget) deletePriority(deleteTarget.id);
            },
          },
        ]}
      />
    </View>
  );
};
