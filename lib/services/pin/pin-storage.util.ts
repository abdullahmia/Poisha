import * as Crypto from 'expo-crypto';
import { SECURE_STORAGE_KEYS } from '@/lib/constants';
import { secureStorage } from '@/lib/storages';

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin + salt);
}

export async function setPinCredentials(pin: string): Promise<void> {
  const salt = Crypto.randomUUID();
  const hash = await hashPin(pin, salt);
  await secureStorage.setItem(SECURE_STORAGE_KEYS.pinSalt, salt);
  await secureStorage.setItem(SECURE_STORAGE_KEYS.pinHash, hash);
  await secureStorage.removeItem(SECURE_STORAGE_KEYS.pinLegacy).catch(() => {});
}

export async function verifyPinCredentials(pin: string): Promise<boolean> {
  const [hash, salt] = await Promise.all([
    secureStorage.getItem(SECURE_STORAGE_KEYS.pinHash),
    secureStorage.getItem(SECURE_STORAGE_KEYS.pinSalt),
  ]);

  if (hash && salt) {
    const candidate = await hashPin(pin, salt);
    return candidate === hash;
  }

  // Migration path: existing installs stored plaintext — re-hash on first successful match
  const legacy = await secureStorage.getItem(SECURE_STORAGE_KEYS.pinLegacy);
  if (legacy !== null) {
    if (legacy === pin) {
      await setPinCredentials(pin);
      return true;
    }
    return false;
  }

  return false;
}

export async function deletePinCredentials(): Promise<void> {
  await Promise.all([
    secureStorage.removeItem(SECURE_STORAGE_KEYS.pinHash).catch(() => {}),
    secureStorage.removeItem(SECURE_STORAGE_KEYS.pinSalt).catch(() => {}),
    secureStorage.removeItem(SECURE_STORAGE_KEYS.pinLegacy).catch(() => {}),
  ]);
}

export async function getPinLockoutUntil(): Promise<number | null> {
  const val = await secureStorage.getItem(SECURE_STORAGE_KEYS.pinLockoutUntil);
  return val ? parseInt(val, 10) : null;
}

export async function setPinLockoutUntil(timestampMs: number): Promise<void> {
  await secureStorage.setItem(SECURE_STORAGE_KEYS.pinLockoutUntil, String(timestampMs));
}

export async function clearPinLockout(): Promise<void> {
  await secureStorage.removeItem(SECURE_STORAGE_KEYS.pinLockoutUntil);
}
