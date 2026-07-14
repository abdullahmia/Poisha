export interface TEntry {
  id: string;
  date: string; // YYYY-MM-DD
  amounts: number[];
  note: string;
}

export type TDraft = Omit<TEntry, 'id'> & { id?: string };
