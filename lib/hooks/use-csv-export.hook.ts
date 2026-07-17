import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { useAlert } from '@/lib/context/alert.context';
import type { TEntry } from '@/lib/types';
import { entriesToCsv } from '@/lib/utils/csv.util';

export function useCsvExport(entries: TEntry[]) {
  const showAlert = useAlert();
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const csv = entriesToCsv(entries);
      const file = new File(Paths.cache, 'poisha-export.csv');
      file.write(csv);
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        showAlert({ title: 'Not available', message: 'Sharing is not supported on this device.' });
        return;
      }
      await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Export Poisha' });
    } catch (e: unknown) {
      showAlert({ title: 'Export failed', message: e instanceof Error ? e.message : 'Unknown error' });
    } finally {
      setExporting(false);
    }
  }

  return { exporting, handleExport };
}
