import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useState } from 'react';
import { Alert } from 'react-native';
import { useEntries } from '@/lib/hooks/use-entries.hook';
import { csvToEntries } from '@/lib/utils/csv.util';

export function useCsvImport() {
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
        Alert.alert('Import failed', 'The file could not be parsed.');
        return;
      }
      Alert.alert(
        'Import CSV',
        `Found ${imported.length} entries. How would you like to import?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Merge',
            onPress: () => {
              importEntries(imported, false);
              Alert.alert('Done', `Imported ${imported.length} entries.`);
            },
          },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: () => {
              importEntries(imported, true);
              Alert.alert('Done', `Imported ${imported.length} entries.`);
            },
          },
        ],
      );
    } catch (e: unknown) {
      Alert.alert('Import failed', e instanceof Error ? e.message : 'The file could not be parsed.');
    } finally {
      setImporting(false);
    }
  }

  return { importing, handleImport };
}
