import { Feather } from '@expo/vector-icons';
import type React from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCategories } from '@/lib/hooks/use-categories.hook';
import { useSmsRules, type TRuleListItem } from '@/lib/hooks/use-sms-rules.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import type { TSmsUserRule } from '@/lib/types';
import { ConfirmModal } from '@/lib/ui/confirm-modal.ui';
import { ScreenHeader } from '../shared/screen-header.component';
import { SettingsGroup } from '../shared/settings-group.component';
import { SmsRuleFormSheet } from './sms-rule-form-sheet.component';

const RuleRow: React.FC<{
  item: TRuleListItem;
  categoryName: string | null;
  onToggle: (value: boolean) => void;
  onPress?: () => void;
}> = ({ item, categoryName, onToggle, onPress }) => {
  const { colors } = useTheme();

  const detail = [item.builtin ? 'Built in' : 'Custom', categoryName].filter(Boolean).join(' · ');

  return (
    <View className="flex-row items-center justify-between gap-4 py-4">
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        className="min-w-0 flex-1 flex-row items-center gap-2 active:opacity-60"
      >
        <View className="min-w-0 flex-1">
          <Text className="text-ink" style={{ fontFamily: 'Inter_400Regular', fontSize: 15 }}>
            {item.label}
          </Text>
          <Text className="mt-1 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 12 }}>
            {detail}
          </Text>
        </View>
        {onPress && <Feather name="chevron-right" size={16} color={colors.inkMuted} />}
      </Pressable>
      <Switch
        value={item.enabled}
        onValueChange={onToggle}
        trackColor={{ false: colors.surfaceAlt, true: colors.accent }}
        thumbColor={colors.surface}
      />
    </View>
  );
};

export const SmsRules: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { categories } = useCategories();
  const { items, userRules, saveRule, deleteRule, setPresetPref } = useSmsRules();

  const [editing, setEditing] = useState<TSmsUserRule | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleting, setDeleting] = useState<TSmsUserRule | null>(null);

  const categoryName = (id: string | null) => categories.find(c => c.id === id)?.name ?? null;

  const presets = items.filter(i => i.builtin);
  const custom = items.filter(i => !i.builtin);

  const openNew = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const openEdit = (rule: TSmsUserRule) => {
    setEditing(rule);
    setSheetOpen(true);
  };

  const handleSave = (rule: TSmsUserRule) => {
    setSheetOpen(false);
    void saveRule(rule);
  };

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 32 + insets.bottom, paddingHorizontal: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Message rules"
        subtitle="How Poisha reads each sender. Turn off the ones you don't use, or add your own bank."
      />

      {/* Built-ins are toggle-and-categorise only. Their patterns are code, and
          that is what lets a fix for a changed SMS format reach everyone over
          the air instead of waiting for a new install. */}
      <SettingsGroup label="Built-in">
        {presets.map(item => (
          <RuleRow
            key={item.id}
            item={item}
            categoryName={categoryName(item.categoryId)}
            onToggle={value => void setPresetPref(item.id, { enabled: value })}
          />
        ))}
      </SettingsGroup>

      <SettingsGroup label="Your rules">
        {custom.length === 0 ? (
          <View className="py-4">
            <Text className="text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 }}>
              Nothing yet. Add a rule if your bank isn&apos;t in the list above, or if Poisha is reading one of its
              messages wrong.
            </Text>
          </View>
        ) : (
          custom.map(item => (
            <RuleRow
              key={item.id}
              item={item}
              categoryName={categoryName(item.categoryId)}
              onToggle={value => item.rule && void saveRule({ ...item.rule, enabled: value })}
              onPress={() => item.rule && openEdit(item.rule)}
            />
          ))
        )}
      </SettingsGroup>

      <Pressable
        onPress={openNew}
        accessibilityRole="button"
        className="mt-6 flex-row items-center justify-center gap-1.5 rounded-2xl border border-line py-3.5 active:opacity-60"
      >
        <Feather name="plus" size={14} color="#888" />
        <Text className="text-ink-soft" style={{ fontFamily: 'Inter_500Medium', fontSize: 14 }}>
          Add a rule
        </Text>
      </Pressable>

      {editing && (
        <Pressable
          onPress={() => setDeleting(editing)}
          accessibilityRole="button"
          className="mt-2 items-center py-3 active:opacity-60"
        >
          <Text className="text-danger" style={{ fontFamily: 'Inter_500Medium', fontSize: 13 }}>
            Delete “{editing.label}”
          </Text>
        </Pressable>
      )}

      <SmsRuleFormSheet
        visible={sheetOpen}
        rule={editing}
        nextSortOrder={userRules.length}
        onClose={() => setSheetOpen(false)}
        onSave={handleSave}
      />

      <ConfirmModal
        visible={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete this rule?"
        message="Messages from that sender fall back to Poisha's general reading, which may get them wrong. Transactions already detected are unaffected."
        icon="trash-2"
        destructive
        actions={[
          {
            label: 'Delete',
            variant: 'danger',
            onPress: () => {
              const target = deleting;
              setDeleting(null);
              setEditing(null);
              if (target) void deleteRule(target.id);
            },
          },
          { label: 'Cancel', variant: 'ghost' },
        ]}
      />
    </ScrollView>
  );
};
