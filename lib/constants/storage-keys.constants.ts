export const ASYNC_STORAGE_KEYS = {
  theme: 'poisha_theme',
  haptics: 'poisha_haptics_enabled',
  locale: 'poisha_locale',
  budget: 'poisha_monthly_budget',
  budgetExceededMonth: 'poisha_budget_exceeded_month',
  notificationsEnabled: 'poisha_notifications_enabled',
  categoriesEnabled: 'poisha_categories_enabled',
  planModeEnabled: 'poisha_plan_mode_enabled',
  sqliteMigrated: 'poisha_sqlite_migrated',
  legacyEntries: 'tracker_entries',
} as const;

export const SECURE_STORAGE_KEYS = {
  pinHash: 'poisha_pin_hash',
  pinSalt: 'poisha_pin_salt',
  pinLegacy: 'poisha_pin',
  pinEnabled: 'poisha_pin_enabled',
  pinOnboarded: 'poisha_pin_onboarded',
  pinLockoutUntil: 'poisha_lockout_until',
  biometricEnabled: 'poisha_biometric_enabled',
} as const;
