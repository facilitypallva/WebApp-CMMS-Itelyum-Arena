type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

let preferPersistentSession = true;

const memoryStorage = (() => {
  const store = new Map<string, string>();

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
})();

function getStorage(type: 'local' | 'session'): StorageLike | null {
  if (typeof window === 'undefined') return null;

  try {
    return type === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function setRememberSession(remember: boolean) {
  preferPersistentSession = remember;
}

export const authStorage: StorageLike = {
  getItem(key) {
    return getStorage('session')?.getItem(key)
      ?? getStorage('local')?.getItem(key)
      ?? memoryStorage.getItem(key);
  },

  setItem(key, value) {
    const sessionStorage = getStorage('session');
    const localStorage = getStorage('local');
    const hasSessionValue = sessionStorage?.getItem(key) !== null;
    const hasLocalValue = localStorage?.getItem(key) !== null;
    const usePersistentStorage = hasSessionValue && !hasLocalValue
      ? false
      : hasLocalValue && !hasSessionValue
        ? true
        : preferPersistentSession;

    if (usePersistentStorage) {
      localStorage?.setItem(key, value);
      sessionStorage?.removeItem(key);
    } else {
      sessionStorage?.setItem(key, value);
      localStorage?.removeItem(key);
    }

    if (!localStorage && !sessionStorage) {
      memoryStorage.setItem(key, value);
    }
  },

  removeItem(key) {
    getStorage('session')?.removeItem(key);
    getStorage('local')?.removeItem(key);
    memoryStorage.removeItem(key);
  },
};
