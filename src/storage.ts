import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const memoryStore = new Map<string, string>();
const storageTimeoutMs = 1200;

async function withStorageTimeout<T>(operation: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    operation,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), storageTimeoutMs);
    }),
  ]);
}

export async function getStoredValue(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return globalThis.localStorage?.getItem(key) ?? memoryStore.get(key) ?? null;
    }

    return withStorageTimeout(SecureStore.getItemAsync(key), memoryStore.get(key) ?? null);
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

export async function setStoredValue(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(key, value);
      memoryStore.set(key, value);
      return;
    }

    await withStorageTimeout(SecureStore.setItemAsync(key, value), undefined);
    memoryStore.set(key, value);
  } catch {
    memoryStore.set(key, value);
  }
}
