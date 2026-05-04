# Implement the kayboard avoiding features

# Dependencies
react-native-keyboard-controller

# uses
// keyboard.wrapper.tsx
import React from 'react';
import { Platform } from 'react-native';
import {
	KeyboardAwareScrollView,
	KeyboardGestureArea,
	type KeyboardAwareScrollViewProps,
} from 'react-native-keyboard-controller';
import { useGlobalContainerStyles } from '~/lib/styles/global-container.style';
import { KEYBOARD_AVOIDING_VIEW } from '~/lib/styles/variables.style';
import { useTheme } from '../contexts';

type KeyboardAvoidingComponentProps = {
	children: React.ReactNode | React.ReactNode[];
	bottomOffset?: number;
	fullWidth?: boolean;
} & KeyboardAwareScrollViewProps;

export const KeyboardAvoidingComponent: React.FC<KeyboardAvoidingComponentProps> = ({
	children,
	contentContainerStyle,
	bottomOffset = KEYBOARD_AVOIDING_VIEW.keyboardVerticalOffset,
	fullWidth = false,
	...rest
}) => {
	const { theme } = useTheme();
	const globalContainerStyles = useGlobalContainerStyles(theme);
	const interpolator = Platform.OS === 'ios' ? 'ios' : 'linear';

	return (
		<KeyboardGestureArea
			interpolator={interpolator}
			style={[{ flex: 1, alignSelf: 'center' }, !fullWidth && globalContainerStyles.wrapper]}
		>
			<KeyboardAwareScrollView
				showsVerticalScrollIndicator={false}
				bounces={false}
				bottomOffset={bottomOffset}
				keyboardShouldPersistTaps="handled"
				{...rest}
				style={[{ width: '100%' }]}
				contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
			>
				{children}
			</KeyboardAwareScrollView>
		</KeyboardGestureArea>
	);
};


// uses
<KeyboardProvider></KeyboardProvider>