import * as SecureStore from 'expo-secure-store';

class AppSecureStorage {
  getItem(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  }

  setItem(key: string, value: string): Promise<void> {
    return SecureStore.setItemAsync(key, value);
  }

  removeItem(key: string): Promise<void> {
    return SecureStore.deleteItemAsync(key);
  }
}

export const secureStorage = new AppSecureStorage();
