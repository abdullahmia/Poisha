import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import type { BiometricAuthResult, BiometricType } from '@/lib/types/biometric.type';

const KEY_BIOMETRIC_ENABLED = 'poisha_biometric_enabled';

class BiometricService {
  async getSupportedType(): Promise<BiometricType> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return 'none';

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) return 'none';

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'faceId';
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'fingerprint';
    return 'none';
  }

  async authenticate(promptMessage: string): Promise<BiometricAuthResult> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: '',
    });
    if (result.success) return { success: true };
    return { success: false, error: result.error };
  }

  async isEnabled(): Promise<boolean> {
    const val = await SecureStore.getItemAsync(KEY_BIOMETRIC_ENABLED);
    return val === '1';
  }

  async setEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync(KEY_BIOMETRIC_ENABLED, enabled ? '1' : '0');
  }
}

export const biometricService = new BiometricService();
