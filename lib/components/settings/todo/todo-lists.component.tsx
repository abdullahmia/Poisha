import { Feather } from '@expo/vector-icons';
import { clsx } from 'clsx';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLOR_SWATCHES } from '@/lib/components/settings/categories/category-form-sheet.component';
import { TODO_LIST_EMOJIS } from '@/lib/constants';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { useTodo } from '@/lib/hooks/use-todo.hook';
import { useTodoTaxonomy } from '@/lib/hooks/use-todo-taxonomy.hook';
import type { TTodoList } from '@/lib/types';
import { BottomSheet } from '@/lib/ui/bottom-sheet.ui';
import { Card } from '@/lib/ui/card.ui';
import { ConfirmModal } from '@/lib/ui/confirm-modal.ui';
import { ReorderButtons, TaxonomyHeader } from './todo-taxonomy-shared.component';

export const TodoLists: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { enabled, loading } = useTodo();
  const { lists, saveList, archiveList, reorderLists } = useTodoTaxonomy();

  useEffect(() => {
    if (!loading && !enabled) router.back();
  }, [loading, enabled]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TTodoList | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(TODO_LIST_EMOJIS[0]);
  const [color, setColor] = useState(COLOR_SWATCHES[0]);
  const [archiveTarget, setArchiveTarget] = useState<TTodoList | null>(null);

  function openAdd() {
    setEditing(null);
    setName('');
    setIcon(TODO_LIST_EMOJIS[0]);
    setColor(COLOR_SWATCHES[lists.length % COLOR_SWATCHES.length]);
    setFormOpen(true);
  }

  function openEdit(list: TTodoList) {
    setEditing(list);
    setName(list.name);
    setIcon(list.icon);
    setColor(list.color);
    setFormOpen(true);
  }

  function handleSave() {
    if (!name.trim()) return;
    saveList({
      // Random rather than `Date.now()` — see the note in use-save-todo.service.ts.
      id: editing?.id ?? `todo_list_${Crypto.randomUUID()}`,
      name: name.trim(),
      icon,
      color,
      sortOrder: editing?.sortOrder ?? lists.length,
      archived: false,
    });
    setFormOpen(false);
  }

  function move(list: TTodoList, dir: -1 | 1) {
    const index = lists.findIndex(l => l.id === list.id);
    const swap = index + dir;
    if (index === -1 || swap < 0 || swap >= lists.length) return;
    const next = [...lists];
    [next[index], next[swap]] = [next[swap], next[index]];
    reorderLists(next.map(l => l.id));
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <TaxonomyHeader
        title="Lists"
        subtitle={lists.length > 0 ? `${lists.length} ${lists.length === 1 ? 'list' : 'lists'}` : undefined}
        onAdd={openAdd}
        addLabel="Add list"
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
          Todos that belong to no list live in Inbox, which is always there and can&apos;t be removed.
        </Text>

        {lists.length === 0 ? (
          <View className="items-center py-16">
            <View className="mb-5 h-16 w-16 items-center justify-center rounded-full border border-line bg-surface">
              <Feather name="folder" size={22} color={colors.inkMuted} />
            </View>
            <Text className="text-ink-soft" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 17 }}>
              No lists
            </Text>
            <Text
              className="mt-1.5 max-w-[250px] text-center text-ink-muted"
              style={{ fontSize: 12.5, fontFamily: 'Inter_400Regular', lineHeight: 18 }}
            >
              Every todo goes to Inbox until you make a list to sort them into.
            </Text>
            <Pressable
              onPress={openAdd}
              className="mt-6 flex-row items-center gap-2 rounded-2xl bg-accent px-5 py-3 active:opacity-80"
            >
              <Feather name="plus" size={15} color="#ffffff" />
              <Text className="text-white" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
                Add List
              </Text>
            </Pressable>
          </View>
        ) : (
          lists.map((list, index) => (
            <Pressable
              key={list.id}
              onPress={() => openEdit(list)}
              className="mb-3"
              style={({ pressed }) => (pressed ? { opacity: 0.75, transform: [{ scale: 0.99 }] } : undefined)}
              accessibilityLabel={`Edit ${list.name}`}
            >
              <Card shadow className="relative flex-row items-center gap-3 overflow-hidden border-0 p-3.5" style={{ shadowOpacity: 0.14 }}>
                <View className="absolute bottom-0 left-0 top-0 w-[3px]" style={{ backgroundColor: list.color }} />

                <View
                  className="h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${list.color}1f`, borderWidth: 1, borderColor: `${list.color}55` }}
                >
                  <Text style={{ fontSize: 19 }}>{list.icon}</Text>
                </View>

                <Text
                  className="flex-1 text-ink"
                  style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14.5, letterSpacing: -0.1 }}
                  numberOfLines={1}
                >
                  {list.name}
                </Text>

                <ReorderButtons
                  isFirst={index === 0}
                  isLast={index === lists.length - 1}
                  onUp={() => move(list, -1)}
                  onDown={() => move(list, 1)}
                />

                <Pressable
                  onPress={e => {
                    e.stopPropagation();
                    setArchiveTarget(list);
                  }}
                  hitSlop={6}
                  className="h-8 w-8 items-center justify-center rounded-full bg-danger-soft active:opacity-70"
                  accessibilityLabel={`Remove ${list.name}`}
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
              {editing ? 'Edit List' : 'New List'}
            </Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="List name"
              placeholderTextColor={colors.inkMuted}
              autoFocus
              className="mb-4 rounded-[10px] border border-line bg-bg px-4 py-3 text-ink"
              style={{ fontFamily: 'Inter_400Regular', fontSize: 15 }}
            />

            <Text
              className="mb-2 uppercase text-ink-muted"
              style={{ fontFamily: 'Inter_500Medium', fontSize: 10, letterSpacing: 1.5 }}
            >
              Icon
            </Text>
            <ScrollView style={{ maxHeight: 140 }} showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap gap-2 pb-1">
                {TODO_LIST_EMOJIS.map(emoji => (
                  <Pressable
                    key={emoji}
                    onPress={() => setIcon(emoji)}
                    className={clsx(
                      'h-11 w-11 items-center justify-center rounded-xl border',
                      icon === emoji ? 'border-accent bg-accent-soft' : 'border-line bg-surface-alt',
                    )}
                    accessibilityLabel={`Choose ${emoji}`}
                  >
                    <Text style={{ fontSize: 20 }}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text
              className="mb-2 mt-4 uppercase text-ink-muted"
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
        visible={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        title="Remove List"
        message={`Todos in "${archiveTarget?.name}" move to Inbox. None of them are deleted.`}
        icon="trash-2"
        destructive
        actions={[
          { label: 'Cancel', variant: 'outline' },
          {
            label: 'Remove',
            variant: 'danger',
            onPress: () => {
              if (archiveTarget) archiveList(archiveTarget.id);
            },
          },
        ]}
      />
    </View>
  );
};
