import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const KEY_PIN_HASH    = 'poisha_pin_hash';
const KEY_PIN_SALT    = 'poisha_pin_salt';
const KEY_PIN_LEGACY  = 'poisha_pin';          // plaintext — only kept for migration
const KEY_ENABLED     = 'poisha_pin_enabled';
const KEY_ONBOARDED   = 'poisha_pin_onboarded';
const KEY_LOCKOUT_UNTIL = 'poisha_lockout_until';

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin + salt);
}

class PinService {
  async setPin(pin: string): Promise<void> {
    const salt = Crypto.randomUUID();
    const hash = await hashPin(pin, salt);
    await SecureStore.setItemAsync(KEY_PIN_SALT, salt);
    await SecureStore.setItemAsync(KEY_PIN_HASH, hash);
    // Remove legacy plaintext value if present
    await SecureStore.deleteItemAsync(KEY_PIN_LEGACY).catch(() => {});
  }

  async verifyPin(pin: string): Promise<boolean> {
    const [hash, salt] = await Promise.all([
      SecureStore.getItemAsync(KEY_PIN_HASH),
      SecureStore.getItemAsync(KEY_PIN_SALT),
    ]);

    if (hash && salt) {
      const candidate = await hashPin(pin, salt);
      return candidate === hash;
    }

    // Migration path: existing installs stored plaintext — re-hash on first successful match
    const legacy = await SecureStore.getItemAsync(KEY_PIN_LEGACY);
    if (legacy !== null) {
      if (legacy === pin) {
        await this.setPin(pin);
        return true;
      }
      return false;
    }

    return false;
  }

  async deletePin(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(KEY_PIN_HASH).catch(() => {}),
      SecureStore.deleteItemAsync(KEY_PIN_SALT).catch(() => {}),
      SecureStore.deleteItemAsync(KEY_PIN_LEGACY).catch(() => {}),
    ]);
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
