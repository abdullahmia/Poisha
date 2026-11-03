import { useCallback } from 'react';
import { SMS_PRESETS } from '@/lib/constants';
import {
  useDeleteSmsRule,
  useSaveSmsRule,
  useSetSmsPresetPref,
  useSmsPresetPrefs,
  useSmsRules as useSmsRulesQuery,
} from '@/lib/services/sms';
import type { TSmsPresetPref, TSmsUserRule } from '@/lib/types';
import { presetCategory, presetEnabled } from '@/lib/utils/sms-rules.util';

/** One row in the rules list, flattening presets and user rules into one shape. */
export type TRuleListItem = {
  id: string;
  label: string;
  builtin: boolean;
  enabled: boolean;
  categoryId: string | null;
  /** Null for presets — their patterns are code and can't be edited. */
  rule: TSmsUserRule | null;
};

export function useSmsRules() {
  const rulesQuery = useSmsRulesQuery();
  const prefsQuery = useSmsPresetPrefs();
  const saveMutation = useSaveSmsRule();
  const deleteMutation = useDeleteSmsRule();
  const setPrefMutation = useSetSmsPresetPref();

  const userRules = rulesQuery.data ?? [];
  const prefs = prefsQuery.data ?? {};

  // Presets first: they're what a new user has, and listing them above the
  // (initially empty) custom rules makes the feature look populated rather
  // than broken.
  const items: TRuleListItem[] = [
    ...SMS_PRESETS.map(preset => ({
      id: preset.id,
      label: preset.label,
      builtin: true,
      enabled: presetEnabled(prefs, preset.id),
      categoryId: presetCategory(prefs, preset.id),
      rule: null,
    })),
    ...userRules.map(rule => ({
      id: rule.id,
      label: rule.label,
      builtin: false,
      enabled: rule.enabled,
      categoryId: rule.categoryId,
      rule,
    })),
  ];

  const saveRule = useCallback((rule: TSmsUserRule) => saveMutation.mutateAsync(rule), [saveMutation]);
  const deleteRule = useCallback((id: string) => deleteMutation.mutateAsync(id), [deleteMutation]);
  const setPresetPref = useCallback(
    (id: string, pref: Partial<TSmsPresetPref>) => setPrefMutation.mutateAsync({ id, pref }),
    [setPrefMutation]
  );

  return {
    items,
    userRules,
    loading: rulesQuery.isPending,
    enabledCount: items.filter(i => i.enabled).length,
    saveRule,
    deleteRule,
    setPresetPref,
  };
}
