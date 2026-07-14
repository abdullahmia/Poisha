import type { TEntry } from '@/lib/types';

const HEADER = 'id,date,amounts,note';

function escapeField(val: string): string {
  if (/[,"\n]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
  return val;
}

export function entriesToCsv(entries: TEntry[]): string {
  const rows = entries.map(e =>
    [e.id, e.date, escapeField(JSON.stringify(e.amounts)), escapeField(e.note)].join(',')
  );
  return [HEADER, ...rows].join('\n');
}

function parseRow(row: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i < row.length) {
    if (row[i] === '"') {
      // quoted field
      let field = '';
      i++; // skip opening quote
      while (i < row.length) {
        if (row[i] === '"' && row[i + 1] === '"') {
          field += '"';
          i += 2;
        } else if (row[i] === '"') {
          i++; // skip closing quote
          break;
        } else {
          field += row[i++];
        }
      }
      fields.push(field);
      if (row[i] === ',') i++;
    } else {
      const end = row.indexOf(',', i);
      if (end === -1) {
        fields.push(row.slice(i));
        break;
      } else {
        fields.push(row.slice(i, end));
        i = end + 1;
      }
    }
  }
  return fields;
}

export function csvToEntries(csv: string): TEntry[] {
  const lines = csv.split('\n').filter(l => l.trim() !== '');
  // skip header
  const dataLines = lines.slice(1);
  const entries: TEntry[] = [];

  for (const line of dataLines) {
    try {
      const fields = parseRow(line);
      if (fields.length < 4) continue;
      const [id, date, amountsRaw, note] = fields;
      if (!id || !date || !amountsRaw) continue;
      const amounts = JSON.parse(amountsRaw) as number[];
      if (!Array.isArray(amounts)) continue;
      entries.push({ id, date, amounts, note: note ?? '' });
    } catch {
      // skip invalid rows
    }
  }

  return entries;
}
