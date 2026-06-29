export const storage = {
  getItem<T>(key: string, fallbackValue: T): T {
    const storedValue = localStorage.getItem(key);

    if (!storedValue) {
      return fallbackValue;
    }

    try {
      return JSON.parse(storedValue) as T;
    } catch {
      return fallbackValue;
    }
  },

  setItem<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  },

  removeItem(key: string): void {
    localStorage.removeItem(key);
  },
};
