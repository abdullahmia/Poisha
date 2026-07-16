import type React from 'react';
import { type ReactNode, useEffect } from 'react';
import {
  type StyleProp,
  type ViewStyle,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode | ((close: () => void) => ReactNode);
  sheetStyle?: StyleProp<ViewStyle>;
  keyboardAvoiding?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  sheetStyle,
  keyboardAvoiding = false,
}) => {
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(600);
  const backdropOpacity = useSharedValue(0);
  const sheetAnimStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  const backdropAnimStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 280, easing: Easing.inOut(Easing.cubic) });
      backdropOpacity.value = withTiming(0.6, { duration: 240 });
    } else {
      translateY.value = withTiming(600, { duration: 240, easing: Easing.inOut(Easing.cubic) });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const close = () => {
    translateY.value = withTiming(600, { duration: 240, easing: Easing.inOut(Easing.cubic) }, () => runOnJS(onClose)());
    backdropOpacity.value = withTiming(0, { duration: 200 });
  };

  const content = (
    <View className="flex-1 justify-end">
      <Animated.View className="absolute inset-0 bg-black" style={backdropAnimStyle}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <Animated.View
        className="rounded-t-[24px] border-t border-line bg-surface"
        style={[
          { paddingBottom: insets.bottom + (Platform.OS === 'ios' ? 24 : 16) },
          sheetStyle,
          sheetAnimStyle,
        ]}
      >
        <View className="mt-[10px] mb-[2px] h-1 w-10 self-center rounded-full bg-line" />
        {typeof children === 'function' ? children(close) : children}
      </Animated.View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          {content}
        </KeyboardAvoidingView>
      ) : content}
    </Modal>
  );
};
