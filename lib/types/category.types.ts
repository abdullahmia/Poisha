export interface TCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
  archived: boolean;
}

export type TCategoryFilter = 'all' | 'uncategorized' | string;
