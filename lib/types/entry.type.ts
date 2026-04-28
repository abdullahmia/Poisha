export interface Entry {
  id: string;
  date: string; // YYYY-MM-DD
  amounts: number[];
  note: string;
}

export type Draft = Omit<Entry, 'id'> & { id?: string };
