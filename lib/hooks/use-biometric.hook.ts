import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback } from 'react';
import { Platform } from 'react-native';
import type { TBiometricAuthResult, TBiometricType } from '@/lib/types';

export function useBiometric() {
  const getSupportedType = useCallback(async (): Promise<TBiometricType> => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return 'none';

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) return 'none';

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (Platform.OS === 'ios') {
      // iOS: Face ID takes priority over Touch ID
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'faceId';
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';
    } else {
      // Android: fingerprint preferred; facial recognition is unreliable on many devices
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'faceId';
    }
    return 'none';
  }, []);

  const authenticate = useCallback(async (promptMessage: string): Promise<TBiometricAuthResult> => {
    const result = await LocalAuthentication.authenticateAsync({ promptMessage, fallbackLabel: '' });
    if (result.success) return { success: true };
    return { success: false, error: result.error };
  }, []);

  return { getSupportedType, authenticate };
}
