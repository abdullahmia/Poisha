import type React from 'react';
import { Pressable, Text, View } from 'react-native';

const COLUMNS = [
  { col: 'id', desc: 'Unique entry ID', example: 'e_1234567890' },
  { col: 'date', desc: 'ISO date', example: 'YYYY-MM-DD' },
  { col: 'amounts', desc: 'JSON array of numbers', example: '[150, 80]' },
  { col: 'note', desc: 'Label (optional)', example: 'groceries' },
  { col: 'source', desc: 'How it was added (optional)', example: 'manual' },
  { col: 'source_ref', desc: 'Internal reference (optional)', example: '' },
];

const EXAMPLE_LINES = [
  'id,date,amounts,note,source,source_ref',
  'e_001,2024-01-15,"[150,80]",groceries,manual,',
  'e_002,2024-01-16,[200],rent,manual,',
];

type CsvFormatSheetProps = { onClose: () => void };

export const CsvFormatSheetContent: React.FC<CsvFormatSheetProps> = ({ onClose }) => {
  return (
    <View className="p-6">
      <Text className="mb-1 text-ink" style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 18 }}>
        CSV Format
      </Text>
      <Text className="mb-5 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 13 }}>
        Your file must include the first four columns in order. The last two are optional.
      </Text>

      {COLUMNS.map(({ col, desc, example }) => (
        <View key={col} className="mb-3 flex-row items-start gap-3">
          <View className="min-w-[72px] items-center rounded-md bg-surface-alt px-2 py-[3px]">
            <Text className="text-ink" style={{ fontFamily: 'DMSans_500Medium', fontSize: 12 }}>{col}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-ink-soft" style={{ fontFamily: 'Inter_400Regular', fontSize: 13 }}>{desc}</Text>
            <Text className="mt-px text-ink-muted" style={{ fontFamily: 'DMSans_400Regular', fontSize: 12 }}>{example}</Text>
          </View>
        </View>
      ))}

      <View className="mb-5 mt-2 rounded-[10px] border border-line bg-bg p-3.5">
        <Text className="mb-2 uppercase text-ink-muted" style={{ fontFamily: 'Inter_500Medium', fontSize: 10, letterSpacing: 1.5 }}>
          Example
        </Text>
        {EXAMPLE_LINES.map((line, i) => (
          <Text
            key={line}
            className={i === 0 ? 'text-ink-muted' : 'text-ink'}
            style={{ fontFamily: 'DMSans_400Regular', fontSize: 11, lineHeight: 18 }}
          >
            {line}
          </Text>
        ))}
      </View>

      <Text className="mb-4 text-ink-muted" style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 }}>
        Categories aren&apos;t included in export or import — imported entries always start as Uncategorized.
      </Text>

      <Pressable onPress={onClose} className="items-center py-3">
        <Text className="text-ink-muted" style={{ fontFamily: 'Inter_500Medium', fontSize: 14 }}>Close</Text>
      </Pressable>
    </View>
  );
};
