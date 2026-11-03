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
import { useTodos } from '@/lib/hooks/use-todos.hook';
import { useTodoTaxonomy } from '@/lib/hooks/use-todo-taxonomy.hook';
import type { TTodoTag } from '@/lib/types';
import { BottomSheet } from '@/lib/ui/bottom-sheet.ui';
import { ConfirmModal } from '@/lib/ui/confirm-modal.ui';
import { EMPTY_TODO_FILTER } from '@/lib/utils/todo-view.util';
import { TaxonomyHeader } from './todo-taxonomy-shared.component';

export const TodoTags: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { enabled, loading } = useTodo();
  const { tags, saveTag, deleteTag } = useTodoTaxonomy();
  const { todos } = useTodos(EMPTY_TODO_FILTER);

  useEffect(() => {
    if (!loading && !enabled) router.back();
  }, [loading, enabled]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TTodoTag | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_SWATCHES[0]);
  const [deleteTarget, setDeleteTarget] = useState<TTodoTag | null>(null);

  function openAdd() {
    setEditing(null);
    setName('');
    setColor(COLOR_SWATCHES[tags.length % COLOR_SWATCHES.length]);
    setFormOpen(true);
  }

  function openEdit(tag: TTodoTag) {
    setEditing(tag);
    setName(tag.name);
    setColor(tag.color);
    setFormOpen(true);
  }

  function handleSave() {
    if (!name.trim()) return;
    saveTag({
      id: editing?.id ?? `todo_tag_${Crypto.randomUUID()}`,
      // Stored without a leading '#'; the UI adds it when rendering, so a user
      // who types one doesn't end up with '##focus' on every card.
      name: name.trim().replace(/^#+/, ''),
      color,
      sortOrder: editing?.sortOrder ?? tags.length,
    });
    setFormOpen(false);
  }

  const usageCount = deleteTarget ? todos.filter(t => t.tagIds.includes(deleteTarget.id)).length : 0;

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <TaxonomyHeader
        title="Tags"
        subtitle={tags.length > 0 ? `${tags.length} ${tags.length === 1 ? 'tag' : 'tags'}` : undefined}
        onAdd={openAdd}
        addLabel="Add tag"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24 + insets.bottom }}
      >
        <Text
          className="mb-5 text-ink-muted"
          style={{ fontFamily: 'Inter_400Regular', fontSize: 12.5, lineHeight: 18 }}
        >
          A todo can carry any number of tags, which is what makes them different from a list.
        </Text>

        {tags.length === 0 ? (
          <View className="items-center py-16">
            <View className="mb-5 h-16 w-16 items-center justify-center rounded-full border border-line bg-surface">
              <Feather name="hash" size={22} color={colors.inkMuted} />
            </View>
            <Text className="text-ink-soft" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 17 }}>
              No tags
            </Text>
            <Text
              className="mt-1.5 max-w-[250px] text-center text-ink-muted"
              style={{ fontSize: 12.5, fontFamily: 'Inter_400Regular', lineHeight: 18 }}
            >
              Add one to cut across your lists — &ldquo;quick&rdquo;, &ldquo;waiting&rdquo;, &ldquo;focus&rdquo;.
            </Text>
            <Pressable
              onPress={openAdd}
              className="mt-6 flex-row items-center gap-2 rounded-2xl bg-accent px-5 py-3 active:opacity-80"
            >
              <Feather name="plus" size={15} color="#ffffff" />
              <Text className="text-white" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
                Add Tag
              </Text>
            </Pressable>
          </View>
        ) : (
          // Tags are small, so they tile rather than stacking as full-width
          // rows — a wall of one-word rows would be mostly empty space.
          <View className="flex-row flex-wrap gap-2.5">
            {tags.map(tag => {
              const count = todos.filter(t => t.tagIds.includes(tag.id)).length;
              return (
                <Pressable
                  key={tag.id}
                  onPress={() => openEdit(tag)}
                  onLongPress={() => setDeleteTarget(tag)}
                  className="flex-row items-center gap-2 rounded-full border px-3.5 py-2.5 active:opacity-70"
                  style={{ borderColor: `${tag.color}66`, backgroundColor: `${tag.color}14` }}
                  accessibilityLabel={`Edit ${tag.name}, used by ${count}`}
                >
                  <View className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13.5, color: tag.color }}>
                    {tag.name}
                  </Text>
                  {count > 0 && (
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: tag.color, opacity: 0.7 }}>
                      {count}
                    </Text>
                  )}
                  <Pressable
                    onPress={e => {
                      e.stopPropagation();
                      setDeleteTarget(tag);
                    }}
                    hitSlop={8}
                    accessibilityLabel={`Remove ${tag.name}`}
                    className="active:opacity-50"
                  >
                    <Feather name="x" size={13} color={tag.color} />
                  </Pressable>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <BottomSheet visible={formOpen} onClose={() => setFormOpen(false)} keyboardAvoiding>
        {() => (
          <View className="p-6">
            <Text className="mb-5 text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 18 }}>
              {editing ? 'Edit Tag' : 'New Tag'}
            </Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Tag name"
              placeholderTextColor={colors.inkMuted}
              autoFocus
              autoCapitalize="none"
              className="mb-4 rounded-[10px] border border-line bg-bg px-4 py-3 text-ink"
              style={{ fontFamily: 'Inter_400Regular', fontSize: 15 }}
            />

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
        title="Remove Tag"
        message={
          usageCount > 0
            ? `"${deleteTarget?.name}" is removed from ${usageCount} ${usageCount === 1 ? 'todo' : 'todos'}. The todos themselves are not deleted.`
            : `"${deleteTarget?.name}" isn't used by any todo.`
        }
        icon="trash-2"
        destructive
        actions={[
          { label: 'Cancel', variant: 'outline' },
          {
            label: 'Remove',
            variant: 'danger',
            onPress: () => {
              if (deleteTarget) deleteTag(deleteTarget.id);
            },
          },
        ]}
      />
    </View>
  );
};
