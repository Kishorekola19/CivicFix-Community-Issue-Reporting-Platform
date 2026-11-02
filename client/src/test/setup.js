import { vi } from 'vitest';
const store = new Map();
Object.defineProperty(globalThis, 'localStorage', { value: {
  getItem: vi.fn(key => store.get(key) ?? null),
  setItem: vi.fn((key, value) => store.set(key, String(value))),
  removeItem: vi.fn(key => store.delete(key)),
  clear: vi.fn(() => store.clear())
}, configurable: true });
