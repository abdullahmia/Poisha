import AsyncStorage from '@react-native-async-storage/async-storage';

class AppAsyncStorage {
  getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }

  setItem(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  }

  removeItem(key: string): Promise<void> {
    return AsyncStorage.removeItem(key);
  }

  /** Reads many keys in one bridge call — used to build a backup snapshot. */
  async multiGet(keys: readonly string[]): Promise<Record<string, string | null>> {
    const pairs = await AsyncStorage.multiGet([...keys]);
    return Object.fromEntries(pairs);
  }

  /**
   * Writes many keys in one bridge call. A `null` value removes the key rather
   * than storing the string "null" — a backup taken before a setting was ever
   * touched carries nulls, and restoring those must clear, not corrupt.
   */
  async multiSet(values: Record<string, string | null>): Promise<void> {
    const toSet: [string, string][] = [];
    const toRemove: string[] = [];

    for (const [key, value] of Object.entries(values)) {
      if (value === null) toRemove.push(key);
      else toSet.push([key, value]);
    }

    if (toSet.length > 0) await AsyncStorage.multiSet(toSet);
    if (toRemove.length > 0) await AsyncStorage.multiRemove(toRemove);
  }
}

export const storage = new AppAsyncStorage();
