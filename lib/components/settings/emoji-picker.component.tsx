import { clsx } from 'clsx';
import type React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

// A curated set of category-relevant emoji rather than a full native emoji
// keyboard — keeps selection fast and avoids a new dependency, matching the
// same tradeoff already made for the color swatches below it.
const EMOJIS = [
  '🍔', '🍕', '🍜', '🍎', '☕', '🍺', '🍷', '🛒',
  '🚗', '🚕', '🚌', '🚆', '✈️', '⛽', '🅿️', '🚲',
  '🏠', '🏢', '🔑', '🛋️', '🛏️', '🚿', '💡', '🔧',
  '💊', '🏥', '🩺', '🦷', '💉', '🧴', '🏋️', '🧘',
  '🎬', '🎮', '🎵', '🎨', '📚', '🎁', '🎉', '🍿',
  '🛍️', '👗', '👟', '💄', '📱', '💻', '⌚', '👜',
  '🏖️', '🗺️', '🧳', '🐶', '🐱', '👶', '🎓', '💼',
  '💰', '💳', '🏦', '📈', '⚽', '🔥', '❤️', '📦',
];

type EmojiPickerProps = {
  value: string;
  onChange: (emoji: string) => void;
};

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ value, onChange }) => {
  return (
    <ScrollView style={{ maxHeight: 190 }} showsVerticalScrollIndicator={false}>
      <View className="flex-row flex-wrap gap-2 pb-1">
        {EMOJIS.map(emoji => {
          const selected = value === emoji;
          return (
            <Pressable
              key={emoji}
              onPress={() => onChange(emoji)}
              className={clsx(
                'h-11 w-11 items-center justify-center rounded-xl border',
                selected ? 'border-accent bg-accent-soft' : 'border-line bg-surface-alt',
              )}
              accessibilityLabel={`Choose ${emoji}`}
            >
              <Text style={{ fontSize: 20 }}>{emoji}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
};
