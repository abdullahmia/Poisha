export const QUERY_KEYS = {
  entries: { all: ['entries'] },
  theme: ['theme'],
  haptics: ['haptics'],
  locale: ['locale'],
  budget: { value: ['budget', 'value'], exceededMonth: ['budget', 'exceededMonth'] },
  notifications: {
    enabled: ['notifications', 'enabled'],
    budgetAlerts: ['notifications', 'budgetAlerts'],
    planReminders: ['notifications', 'planReminders'],
  },
  categories: { all: ['categories'], enabled: ['categories', 'enabled'] },
  planMode: { enabled: ['planMode', 'enabled'] },
  pin: { status: ['pin', 'status'] },
  biometric: { enabled: ['biometric', 'enabled'] },
} as const;
