export const ASYNC_STORAGE_KEYS = {
  theme: "poisha_theme",
  haptics: "poisha_haptics_enabled",
  locale: "poisha_locale",
  budget: "poisha_monthly_budget",
  budgetExceededMonth: "poisha_budget_exceeded_month",
  notificationsEnabled: "poisha_notifications_enabled",
  categoriesEnabled: "poisha_categories_enabled",
  planModeEnabled: "poisha_plan_mode_enabled",
  budgetAlertsEnabled: "poisha_budget_alerts_enabled",
  planRemindersEnabled: "poisha_plan_reminders_enabled",
  sqliteMigrated: "poisha_sqlite_migrated",
  legacyEntries: "tracker_entries",
  backupEnabled: "poisha_backup_enabled",
  backupFrequency: "poisha_backup_frequency",
  backupLastAt: "poisha_backup_last_at",
  backupLastStatus: "poisha_backup_last_status",
  backupAccountEmail: "poisha_backup_account_email",
  backupPromoDismissed: "poisha_backup_promo_dismissed",
  smsEnabled: "poisha_sms_enabled",
  smsScanCursor: "poisha_sms_scan_cursor",
  smsLastScanAt: "poisha_sms_last_scan_at",
  smsPresetPrefs: "poisha_sms_preset_prefs",
  smsAlertsEnabled: "poisha_sms_alerts_enabled",
} as const;

export const BACKED_UP_SETTING_KEYS = [
  ASYNC_STORAGE_KEYS.theme,
  ASYNC_STORAGE_KEYS.haptics,
  ASYNC_STORAGE_KEYS.locale,
  ASYNC_STORAGE_KEYS.budget,
  ASYNC_STORAGE_KEYS.notificationsEnabled,
  ASYNC_STORAGE_KEYS.categoriesEnabled,
  ASYNC_STORAGE_KEYS.planModeEnabled,
  ASYNC_STORAGE_KEYS.budgetAlertsEnabled,
  ASYNC_STORAGE_KEYS.planRemindersEnabled,
  // The feature flag travels; the scan cursor and last-scan time deliberately
  // do not. Both describe how far *this* device has read *its* inbox, and
  // restoring either onto another phone would make it skip real messages.
  ASYNC_STORAGE_KEYS.smsEnabled,
  ASYNC_STORAGE_KEYS.smsPresetPrefs,
  ASYNC_STORAGE_KEYS.smsAlertsEnabled,
] as const;

export const SECURE_STORAGE_KEYS = {
  pinHash: "poisha_pin_hash",
  pinSalt: "poisha_pin_salt",
  pinLegacy: "poisha_pin",
  pinEnabled: "poisha_pin_enabled",
  pinOnboarded: "poisha_pin_onboarded",
  pinLockoutUntil: "poisha_lockout_until",
  biometricEnabled: "poisha_biometric_enabled",
} as const;
