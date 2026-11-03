export const ASYNC_STORAGE_KEYS = {
  theme: "poisha_theme",
  haptics: "poisha_haptics_enabled",
  locale: "poisha_locale",
  budget: "poisha_monthly_budget",
  budgetExceededMonth: "poisha_budget_exceeded_month",
  notificationsEnabled: "poisha_notifications_enabled",
  categoriesEnabled: "poisha_categories_enabled",
  planModeEnabled: "poisha_plan_mode_enabled",
  todoEnabled: "poisha_todo_enabled",
  todoPrefs: "poisha_todo_prefs",
  todoRemindersEnabled: "poisha_todo_reminders_enabled",
  todoCarryOverDate: "poisha_todo_carry_over_date",
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
  // `todoCarryOverDate` is deliberately absent — it is a device-local "already
  // rolled forward today" stamp, like budgetExceededMonth, and restoring
  // another device's stamp would skip this device's first carry-over.
  ASYNC_STORAGE_KEYS.todoEnabled,
  ASYNC_STORAGE_KEYS.todoPrefs,
  ASYNC_STORAGE_KEYS.todoRemindersEnabled,
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
