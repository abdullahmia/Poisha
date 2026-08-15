import type React from 'react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCategories } from '@/lib/hooks/use-categories.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import type { TCategory } from '@/lib/types';
import { BottomSheet } from '@/lib/ui/bottom-sheet.ui';
import { Card } from '@/lib/ui/card.ui';
import { ConfirmModal } from '@/lib/ui/confirm-modal.ui';
import { CategoryFormSheetContent, COLOR_SWATCHES } from './category-form-sheet.component';

// Pushed from Settings, so it owns a back button. The Settings row that opens
// it is already gated on the feature flag; this guard only covers the odd case
// of landing here after the flag flips, and waits for `loading` so a pending
// flag query can't bounce the screen straight back on mount.
export const Categories: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { enabled, loading, categories, saveCategory, archiveCategory, reorderCategories } = useCategories();

  useEffect(() => {
    if (!loading && !enabled) router.back();
  }, [loading, enabled]);

  const [query, setQuery] = useState('');
  const [archiveTarget, setArchiveTarget] = useState<TCategory | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TCategory | null>(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('🙂');
  const [formColor, setFormColor] = useState(COLOR_SWATCHES[0]);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(c => c.name.toLowerCase().includes(q));
  }, [categories, query]);

  function openAddForm() {
    setEditingCategory(null);
    setFormName('');
    setFormIcon('🙂');
    setFormColor(COLOR_SWATCHES[0]);
    setEmojiPickerOpen(false);
    setFormOpen(true);
  }

  function openEditForm(category: TCategory) {
    setEditingCategory(category);
    setFormName(category.name);
    setFormIcon(category.icon);
    setFormColor(category.color);
    setEmojiPickerOpen(false);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEmojiPickerOpen(false);
  }

  function handleFormSave() {
    if (!formName.trim()) return;
    saveCategory({
      id: editingCategory?.id ?? `cat_${Date.now()}`,
      name: formName.trim(),
      icon: formIcon,
      color: formColor,
      sortOrder: editingCategory?.sortOrder ?? categories.length,
      archived: false,
    });
    closeForm();
  }

  function move(category: TCategory, dir: -1 | 1) {
    const index = categories.findIndex(c => c.id === category.id);
    const swapIndex = index + dir;
    if (index === -1 || swapIndex < 0 || swapIndex >= categories.length) return;
    const next = [...categories];
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    reorderCategories(next.map(c => c.id));
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-6 pt-2">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-surface-alt active:opacity-60"
          accessibilityLabel="Back"
        >
          <Feather name="chevron-left" size={18} color={colors.inkSoft} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 24, letterSpacing: -0.5 }}>
            Categories
          </Text>
          {categories.length > 0 && (
            <Text className="mt-0.5 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 12.5 }}>
              {categories.length} {categories.length === 1 ? 'category' : 'categories'}
            </Text>
          )}
        </View>
        <Pressable
          onPress={openAddForm}
          className="h-10 w-10 items-center justify-center rounded-full bg-accent active:opacity-80"
          accessibilityLabel="Add category"
          style={{
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.28,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Feather name="plus" size={19} color="#ffffff" />
        </Pressable>
      </View>

      <View className="mx-6 mt-5 flex-row items-center rounded-2xl border border-line bg-surface-alt px-4 py-3.5">
        <Feather name="search" size={15} color={colors.inkMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search categories…"
          placeholderTextColor={colors.inkMuted}
          autoCapitalize="none"
          className="ml-2.5 flex-1 text-ink"
          style={{ fontSize: 14, fontFamily: 'Inter_400Regular' }}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
            <Feather name="x" size={15} color={colors.inkMuted} />
          </Pressable>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 18,
          paddingBottom: 24 + insets.bottom,
        }}
      >
        {categories.length === 0 ? (
          <View className="items-center py-16">
            <View className="mb-5 h-16 w-16 items-center justify-center rounded-full border border-line bg-surface">
              <Feather name="tag" size={22} color={colors.inkMuted} />
            </View>
            <Text className="text-ink-soft" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 17 }}>
              No categories yet
            </Text>
            <Text className="mt-1.5 max-w-[240px] text-center text-ink-muted" style={{ fontSize: 12.5, fontFamily: 'Inter_400Regular', lineHeight: 18 }}>
              Create a category to start tagging your entries.
            </Text>
            <Pressable
              onPress={openAddForm}
              className="mt-6 flex-row items-center gap-2 rounded-2xl bg-accent px-5 py-3 active:opacity-80"
            >
              <Feather name="plus" size={15} color="#ffffff" />
              <Text className="text-white" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Add Category</Text>
            </Pressable>
          </View>
        ) : filtered.length === 0 ? (
          <View className="items-center py-16">
            <View className="mb-5 h-16 w-16 items-center justify-center rounded-full border border-line bg-surface">
              <Feather name="search" size={22} color={colors.inkMuted} />
            </View>
            <Text className="text-ink-soft" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 17 }}>No matches</Text>
            <Text className="mt-1.5 max-w-[240px] text-center text-ink-muted" style={{ fontSize: 12.5, fontFamily: 'Inter_400Regular', lineHeight: 18 }}>
              No categories match “{query.trim()}”.
            </Text>
            <Pressable onPress={() => setQuery('')} className="mt-6 rounded-2xl border border-line px-5 py-3 active:opacity-70">
              <Text className="text-ink-soft" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Clear Search</Text>
            </Pressable>
          </View>
        ) : (
          filtered.map(category => {
            const trueIndex = categories.findIndex(c => c.id === category.id);
            const isFirst = trueIndex === 0;
            const isLast = trueIndex === categories.length - 1;
            return (
              <Pressable
                key={category.id}
                onPress={() => openEditForm(category)}
                className="mb-3"
                style={({ pressed }) => (pressed ? { opacity: 0.75, transform: [{ scale: 0.99 }] } : undefined)}
                accessibilityLabel={`Edit ${category.name}`}
              >
                <Card shadow className="relative flex-row items-center gap-3 overflow-hidden border-0 p-3.5" style={{ shadowOpacity: 0.14 }}>
                  <View className="absolute bottom-0 left-0 top-0 w-[3px]" style={{ backgroundColor: category.color }} />

                  <View
                    className="h-11 w-11 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${category.color}1f`, borderWidth: 1, borderColor: `${category.color}55` }}
                  >
                    <Text style={{ fontSize: 19 }}>{category.icon}</Text>
                  </View>

                  <Text className="flex-1 text-ink" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14.5, letterSpacing: -0.1 }} numberOfLines={1}>
                    {category.name}
                  </Text>

                  <View className="flex-row items-center gap-1.5 overflow-hidden rounded-lg bg-surface-alt">
                    <Pressable
                      onPress={e => {
                        e.stopPropagation();
                        move(category, -1);
                      }}
                      disabled={isFirst}
                      hitSlop={6}
                      className="px-1.5 py-2"
                      style={isFirst ? { opacity: 0.25 } : undefined}
                      accessibilityLabel="Move up"
                    >
                      <Feather name="chevron-up" size={15} color={colors.inkSoft} />
                    </Pressable>
                    <View className="h-4 w-px bg-line" />
                    <Pressable
                      onPress={e => {
                        e.stopPropagation();
                        move(category, 1);
                      }}
                      disabled={isLast}
                      hitSlop={6}
                      className="px-1.5 py-2"
                      style={isLast ? { opacity: 0.25 } : undefined}
                      accessibilityLabel="Move down"
                    >
                      <Feather name="chevron-down" size={15} color={colors.inkSoft} />
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={e => {
                      e.stopPropagation();
                      setArchiveTarget(category);
                    }}
                    hitSlop={6}
                    className="h-8 w-8 items-center justify-center rounded-full bg-danger-soft active:opacity-70"
                    accessibilityLabel={`Remove ${category.name}`}
                  >
                    <Feather name="trash-2" size={14} color={colors.danger} />
                  </Pressable>
                </Card>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <BottomSheet visible={formOpen} onClose={closeForm} keyboardAvoiding>
        {() => (
          <CategoryFormSheetContent
            isEdit={!!editingCategory}
            name={formName}
            setName={setFormName}
            icon={formIcon}
            setIcon={setFormIcon}
            color={formColor}
            setColor={setFormColor}
            pickerOpen={emojiPickerOpen}
            setPickerOpen={setEmojiPickerOpen}
            onSave={handleFormSave}
            onCancel={closeForm}
          />
        )}
      </BottomSheet>

      <ConfirmModal
        visible={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        title="Remove Category"
        message={`"${archiveTarget?.name}" will no longer appear when adding entries. Past entries keep it for their history.`}
        icon="trash-2"
        destructive
        actions={[
          { label: 'Cancel', variant: 'outline' },
          {
            label: 'Remove',
            variant: 'danger',
            onPress: () => {
              if (archiveTarget) archiveCategory(archiveTarget.id);
            },
          },
        ]}
      />
    </View>
  );
};
