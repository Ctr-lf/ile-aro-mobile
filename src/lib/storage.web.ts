/** Browser storage for the web preview. Falls back to memory while pages are rendered on the server. */
const memory = new Map<string, string>();
const fallback = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => void memory.set(key, value),
  removeItem: (key: string) => void memory.delete(key),
  clear: () => memory.clear(),
  key: (i: number) => [...memory.keys()][i] ?? null,
  get length() {
    return memory.size;
  },
} as Storage;

export const storage: Storage = typeof window !== "undefined" && window.localStorage ? window.localStorage : fallback;
