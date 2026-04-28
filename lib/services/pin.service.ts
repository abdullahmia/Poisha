import * as SecureStore from 'expo-secure-store';

const KEY_PIN = 'poisha_pin';
const KEY_ENABLED = 'poisha_pin_enabled';
const KEY_ONBOARDED = 'poisha_pin_onboarded';
const KEY_LOCKOUT_UNTIL = 'poisha_lockout_until';

class PinService {
  async getPin(): Promise<string | null> {
    return SecureStore.getItemAsync(KEY_PIN);
  }

  async setPin(pin: string): Promise<void> {
    await SecureStore.setItemAsync(KEY_PIN, pin);
  }

  async deletePin(): Promise<void> {
    await SecureStore.deleteItemAsync(KEY_PIN);
  }

  async isLockEnabled(): Promise<boolean> {
    return (await SecureStore.getItemAsync(KEY_ENABLED)) === '1';
  }

  async setLockEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync(KEY_ENABLED, enabled ? '1' : '0');
  }

  async hasOnboarded(): Promise<boolean> {
    return (await SecureStore.getItemAsync(KEY_ONBOARDED)) === '1';
  }

  async markOnboarded(): Promise<void> {
    await SecureStore.setItemAsync(KEY_ONBOARDED, '1');
  }

  async getLockoutUntil(): Promise<number | null> {
    const val = await SecureStore.getItemAsync(KEY_LOCKOUT_UNTIL);
    return val ? parseInt(val, 10) : null;
  }

  async setLockoutUntil(timestampMs: number): Promise<void> {
    await SecureStore.setItemAsync(KEY_LOCKOUT_UNTIL, String(timestampMs));
  }

  async clearLockout(): Promise<void> {
    await SecureStore.deleteItemAsync(KEY_LOCKOUT_UNTIL);
  }
}

export const pinService = new PinService();
