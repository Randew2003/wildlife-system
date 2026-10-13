const memoryStorage = new Map<string, string>();

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function getLocalStorage(): StorageLike | null {
  const candidate = (globalThis as { localStorage?: StorageLike }).localStorage;

  if (!candidate) {
    return null;
  }

  try {
    const testKey = '__wildlife_storage_test__';
    candidate.setItem(testKey, testKey);
    candidate.removeItem(testKey);
    return candidate;
  } catch {
    return null;
  }
}

export async function getStoredValue(key: string) {
  const localStorage = getLocalStorage();

  if (localStorage) {
    return localStorage.getItem(key);
  }

  return memoryStorage.get(key) ?? null;
}

export async function setStoredValue(key: string, value: string) {
  const localStorage = getLocalStorage();

  if (localStorage) {
    localStorage.setItem(key, value);
    return;
  }

  memoryStorage.set(key, value);
}

export async function removeStoredValue(key: string) {
  const localStorage = getLocalStorage();

  if (localStorage) {
    localStorage.removeItem(key);
    return;
  }

  memoryStorage.delete(key);
}

export async function getStoredJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await getStoredValue(key);

  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setStoredJson<T>(key: string, value: T) {
  await setStoredValue(key, JSON.stringify(value));
}
