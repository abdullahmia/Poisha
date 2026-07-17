import type { TCategory } from '@/lib/types';

export const DEFAULT_CATEGORIES: TCategory[] = [
  { id: 'food', name: 'Food', icon: '🍔', color: '#e8734a', sortOrder: 0, archived: false },
  { id: 'transport', name: 'Transport', icon: '🚗', color: '#4a90c0', sortOrder: 1, archived: false },
  { id: 'housing', name: 'Housing', icon: '🏠', color: '#8a6bc0', sortOrder: 2, archived: false },
  { id: 'bills', name: 'Bills', icon: '💡', color: '#c0a34a', sortOrder: 3, archived: false },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#c04a8a', sortOrder: 4, archived: false },
  { id: 'health', name: 'Health', icon: '💊', color: '#4ac07a', sortOrder: 5, archived: false },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#c05a4a', sortOrder: 6, archived: false },
  { id: 'other', name: 'Other', icon: '📦', color: '#8a8a8a', sortOrder: 7, archived: false },
];
