export const QUERY_KEYS = {
  entries: { all: ['entries'] },
  theme: ['theme'],
  haptics: ['haptics'],
  locale: ['locale'],
  budget: { value: ['budget', 'value'], exceededMonth: ['budget', 'exceededMonth'] },
  pin: { status: ['pin', 'status'] },
  biometric: { enabled: ['biometric', 'enabled'] },
} as const;
