import { type ReactNode, useEffect, useMemo } from 'react';
import {
  type StyleProp,
  type ViewStyle,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type Palette } from '@/lib/constants/theme';
import { useTheme } from '@/lib/hooks/use-theme.hook';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode | ((close: () => void) => ReactNode);
  sheetStyle?: StyleProp<ViewStyle>;
  keyboardAvoiding?: boolean;
}

function createStyles(c: Palette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#000000',
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: 1,
      borderTopColor: c.line,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.line,
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 2,
    },
  });
}

export function BottomSheet({
  visible,
  onClose,
  children,
  sheetStyle,
  keyboardAvoiding = false,
}: BottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
    <View style={styles.root}>
      <Animated.View style={[styles.backdrop, backdropAnimStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + (Platform.OS === 'ios' ? 24 : 16) },
          sheetStyle,
          sheetAnimStyle,
        ]}
      >
        <View style={styles.handle} />
        {typeof children === 'function' ? children(close) : children}
      </Animated.View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      {keyboardAvoiding ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          {content}
        </KeyboardAvoidingView>
      ) : content}
    </Modal>
  );
}
