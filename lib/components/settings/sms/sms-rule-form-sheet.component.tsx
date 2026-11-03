import { Feather } from '@expo/vector-icons';
import { clsx } from 'clsx';
import * as Crypto from 'expo-crypto';
import type React from 'react';
import { useMemo, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardGestureArea } from 'react-native-keyboard-controller';
import { CategoryPicker } from '@/lib/components/entries/category-picker.component';
import { GENERIC_RULE, SMS_PRESETS } from '@/lib/constants';
import { useCategories } from '@/lib/hooks/use-categories.hook';
import { useTheme } from '@/lib/hooks/use-theme.hook';
import { smsRuleFormSchema } from '@/lib/schemas/sms.schemas';
import type { TSmsUserRule } from '@/lib/types';
import { BottomSheet } from '@/lib/ui/bottom-sheet.ui';
import { compileUserRule, parseSms } from '@/lib/utils/sms-parser.util';

type SmsRuleFormSheetProps = {
  visible: boolean;
  /** Null when adding. */
  rule: TSmsUserRule | null;
  nextSortOrder: number;
  onClose: () => void;
  onSave: (rule: TSmsUserRule) => void;
};

const EMPTY = {
  label: '',
  senderPattern: '',
  amountPattern: '',
  excludePattern: '',
  currency: '',
  categoryId: null as string | null,
  enabled: true,
};

const Field: React.FC<{
  label: string;
  hint?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences';
}> = ({ label, hint, value, onChangeText, placeholder, autoCapitalize = 'none' }) => {
  const { colors } = useTheme();
  return (
    <View className="px-5 pt-[22px]">
      <Text className="mb-2 px-1 uppercase text-ink-muted" style={{ fontSize: 10, letterSpacing: 2, fontWeight: '600' }}>
        {label}
      </Text>
      <View className="flex-row items-center rounded-2xl border border-line bg-surface-alt px-4 py-[15px]">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.inkMuted}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          className="flex-1 text-ink"
          style={{ fontSize: 14, fontFamily: 'DMSans_400Regular' }}
        />
      </View>
      {hint && (
        <Text className="mt-1.5 px-1 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 }}>
          {hint}
        </Text>
      )}
    </View>
  );
};

const SheetContent: React.FC<Omit<SmsRuleFormSheetProps, 'visible'> & { onClose: () => void }> = ({
  rule,
  nextSortOrder,
  onClose,
  onSave,
}) => {
  const { colors } = useTheme();
  const { enabled: categoriesEnabled, categories } = useCategories();

  const [form, setForm] = useState(rule ? { ...rule } : { ...EMPTY });
  const [sample, setSample] = useState('');

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const validation = smsRuleFormSchema.safeParse(form);
  const error = validation.success ? null : validation.error.issues[0]?.message ?? null;

  /**
   * The feature that makes this screen usable: paste a real message and watch
   * the rule you are writing run against it. Possible only because
   * `sms-parser.util.ts` is pure — no storage, no native, no React.
   */
  const preview = useMemo(() => {
    if (!sample.trim() || !validation.success) return null;

    const candidate = compileUserRule({
      ...form,
      id: rule?.id ?? 'preview',
      sortOrder: rule?.sortOrder ?? nextSortOrder,
    } as TSmsUserRule);
    if (!candidate) return null;

    // The rule under test plus the presets it would compete with, so the
    // preview shows what would really happen rather than the rule in isolation.
    return parseSms(form.senderPattern, sample, [candidate, ...SMS_PRESETS, GENERIC_RULE]);
  }, [sample, form, rule, nextSortOrder, validation.success]);

  const save = () => {
    if (!validation.success) return;
    onSave({
      ...validation.data,
      id: rule?.id ?? `sr_${Crypto.randomUUID()}`,
      sortOrder: rule?.sortOrder ?? nextSortOrder,
    });
  };

  return (
    <KeyboardGestureArea interpolator={Platform.OS === 'ios' ? 'ios' : 'linear'} className="flex-1">
      <KeyboardAwareScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" bottomOffset={24} bounces={false}>
        <View className="flex-row items-center justify-between px-6 pb-2 pt-3">
          <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 24, letterSpacing: -0.4 }}>
            {rule ? 'Edit rule' : 'New rule'}
          </Text>
          <Pressable onPress={onClose} className="h-9 w-9 items-center justify-center rounded-full bg-surface-alt">
            <Feather name="x" size={16} color={colors.inkSoft} />
          </Pressable>
        </View>

        <Field label="Name" value={form.label} onChangeText={v => set('label', v)} placeholder="My bank" autoCapitalize="sentences" />
        <Field
          label="Sender"
          hint="The sender id your bank texts from. Plain text works; it's matched as a pattern, so MYBANK|12345 matches either."
          value={form.senderPattern}
          onChangeText={v => set('senderPattern', v)}
          placeholder="MYBANK"
        />
        <Field
          label="Amount pattern"
          hint="Optional. Leave blank and Poisha works the amount out itself. If your bank's format confuses it, write a pattern whose first (…) group is the amount."
          value={form.amountPattern}
          onChangeText={v => set('amountPattern', v)}
          placeholder="debited by BDT ([0-9.,]+)"
        />
        <Field
          label="Ignore if"
          hint="Optional. Messages from this sender matching this are skipped entirely."
          value={form.excludePattern}
          onChangeText={v => set('excludePattern', v)}
          placeholder="statement|reminder"
        />
        <Field
          label="Currency"
          hint="Optional. Used only when the message itself doesn't say."
          value={form.currency}
          onChangeText={v => set('currency', v.toUpperCase())}
          placeholder="BDT"
        />

        {categoriesEnabled && (
          <CategoryPicker categories={categories} value={form.categoryId} onChange={v => set('categoryId', v)} />
        )}

        {/* Pre-seeded with nothing rather than a sample: a real message from
            the user's own bank is the only test that proves anything here. */}
        <View className="px-5 pt-[22px]">
          <Text className="mb-2 px-1 uppercase text-ink-muted" style={{ fontSize: 10, letterSpacing: 2, fontWeight: '600' }}>
            Try it
          </Text>
          <View className="rounded-2xl border border-line bg-surface-alt px-4 py-[15px]">
            <TextInput
              value={sample}
              onChangeText={setSample}
              placeholder="Paste a real message from this sender…"
              placeholderTextColor={colors.inkMuted}
              multiline
              autoCorrect={false}
              className="text-ink"
              style={{ fontSize: 13, fontFamily: 'DMSans_400Regular', minHeight: 56 }}
            />
          </View>

          {sample.trim().length > 0 && (
            <View className="mt-3 rounded-2xl border border-line bg-bg p-3.5">
              {preview ? (
                <>
                  <View className="flex-row items-baseline justify-between">
                    <Text className="text-ink" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
                      {preview.merchant || preview.ruleLabel}
                    </Text>
                    <Text className="text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 16 }}>
                      {preview.amount === null ? '—' : preview.amount}
                    </Text>
                  </View>
                  <Text className="mt-1 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 }}>
                    {preview.direction === 'credit'
                      ? 'Money in — Poisha skips these, it only records spending.'
                      : `Matched ${preview.ruleLabel} · confidence ${Math.round(preview.confidence * 100)}%${preview.reference ? ` · ${preview.reference}` : ''}`}
                  </Text>
                </>
              ) : (
                <Text className="text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 }}>
                  No transaction found in this message. Either it isn&apos;t one, or the sender and amount pattern above
                  don&apos;t match it yet.
                </Text>
              )}
            </View>
          )}
        </View>

        {error && (
          <Text className="px-6 pt-4 text-danger" style={{ fontFamily: 'Inter_500Medium', fontSize: 12 }}>
            {error}
          </Text>
        )}

        <View className="px-5 pt-[26px]">
          <Pressable
            onPress={save}
            disabled={!validation.success}
            className={clsx('items-center rounded-2xl py-[17px]', validation.success ? 'bg-accent' : 'bg-surface-alt')}
          >
            <Text
              className={clsx('uppercase', validation.success ? 'text-bg' : 'text-ink-muted')}
              style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, letterSpacing: 0.6 }}
            >
              {rule ? 'Save rule' : 'Add rule'}
            </Text>
          </Pressable>
        </View>

        <View className="h-2" />
      </KeyboardAwareScrollView>
    </KeyboardGestureArea>
  );
};

export const SmsRuleFormSheet: React.FC<SmsRuleFormSheetProps> = ({
  visible,
  rule,
  nextSortOrder,
  onClose,
  onSave,
}) => (
  <BottomSheet
    visible={visible}
    onClose={onClose}
    sheetStyle={{ minHeight: '88%' as unknown as number, maxHeight: '96%' as unknown as number }}
  >
    {close =>
      visible ? (
        <SheetContent rule={rule} nextSortOrder={nextSortOrder} onClose={close} onSave={onSave} />
      ) : null
    }
  </BottomSheet>
);
