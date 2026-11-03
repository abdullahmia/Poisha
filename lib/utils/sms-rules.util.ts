import { ASYNC_STORAGE_KEYS, GENERIC_RULE, SMS_PRESETS } from '@/lib/constants';
import { sqliteStorage, storage } from '@/lib/storages';
import type { TSmsPresetPref, TSmsRule } from '@/lib/types';
import { compileUserRule } from '@/lib/utils/sms-parser.util';

/**
 * Assembles the rule list the parser actually runs with: enabled presets, plus
 * the user's own rules, plus the generic fallback.
 *
 * Runs outside React — the scan and the live receiver both need it and neither
 * is a component.
 */

export type TSmsPresetPrefs = Record<string, TSmsPresetPref>;

export type TEffectiveRules = {
  rules: TSmsRule[];
  /** ruleId → suggested category, applied to anything that rule matches. */
  categoryByRuleId: Record<string, string | null>;
};

export async function loadPresetPrefs(): Promise<TSmsPresetPrefs> {
  const raw = await storage.getItem(ASYNC_STORAGE_KEYS.smsPresetPrefs);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === 'object' && parsed !== null ? (parsed as TSmsPresetPrefs) : {};
  } catch {
    // Corrupt blob: fall back to "all presets on", which is the default and
    // strictly better than refusing to scan.
    return {};
  }
}

export async function savePresetPrefs(prefs: TSmsPresetPrefs): Promise<void> {
  await storage.setItem(ASYNC_STORAGE_KEYS.smsPresetPrefs, JSON.stringify(prefs));
}

/** Absent means on — a preset the user has never touched should just work. */
export function presetEnabled(prefs: TSmsPresetPrefs, id: string): boolean {
  return prefs[id]?.enabled !== false;
}

export function presetCategory(prefs: TSmsPresetPrefs, id: string): string | null {
  return prefs[id]?.categoryId ?? null;
}

export async function loadEffectiveRules(): Promise<TEffectiveRules> {
  const prefs = await loadPresetPrefs();
  const userRules = sqliteStorage.loadSmsRules().filter(r => r.enabled);

  const compiled = userRules
    .map(compileUserRule)
    .filter((r): r is TSmsRule => r !== null);

  const enabledPresets = SMS_PRESETS.filter(p => presetEnabled(prefs, p.id));

  const categoryByRuleId: Record<string, string | null> = {};
  for (const preset of enabledPresets) categoryByRuleId[preset.id] = presetCategory(prefs, preset.id);
  for (const rule of userRules) categoryByRuleId[rule.id] = rule.categoryId;

  // GENERIC_RULE last and lowest-priority; `pickRule` falls back to it anyway,
  // but including it keeps the list a complete description of the ruleset.
  return { rules: [...compiled, ...enabledPresets, GENERIC_RULE], categoryByRuleId };
}
