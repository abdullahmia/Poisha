import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useState } from 'react';
import { useAlert } from '@/lib/context/alert.context';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { csvToEntries } from '@/lib/utils/csv.util';

export function useCsvImport() {
  const showAlert = useAlert();
  const { importEntries } = useEntries();
  const [importing, setImporting] = useState(false);

  async function handleImport() {
    setImporting(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'text/csv', copyToCacheDirectory: true });
      if (result.canceled) return;
      const csv = await new File(result.assets[0].uri).text();
      const imported = csvToEntries(csv);
      if (imported.length === 0) {
        showAlert({ title: 'Import failed', message: 'The file could not be parsed.' });
        return;
      }
      showAlert({
        title: 'Import CSV',
        message: `Found ${imported.length} entries. How would you like to import?`,
        actions: [
          { label: 'Cancel', variant: 'outline' },
          {
            label: 'Merge',
            variant: 'solid',
            onPress: () => {
              importEntries(imported, false);
              showAlert({ title: 'Done', message: `Imported ${imported.length} entries.` });
            },
          },
          {
            label: 'Replace',
            variant: 'danger',
            onPress: () => {
              importEntries(imported, true);
              showAlert({ title: 'Done', message: `Imported ${imported.length} entries.` });
            },
          },
        ],
      });
    } catch (e: unknown) {
      showAlert({ title: 'Import failed', message: e instanceof Error ? e.message : 'The file could not be parsed.' });
    } finally {
      setImporting(false);
    }
  }

  return { importing, handleImport };
}
