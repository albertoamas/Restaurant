import '@testing-library/jest-dom';
import { vi } from 'vitest';

// JSDOM does not implement object URLs. Browser-facing print/download helpers
// depend on them, so provide deterministic test doubles globally.
Object.defineProperty(URL, 'createObjectURL', {
  configurable: true,
  writable: true,
  value: vi.fn(() => 'blob:test-object-url'),
});

// Node ≥ 25 expone un `localStorage`/`sessionStorage` global propio que tapa al de jsdom y,
// sin `--localstorage-file`, no tiene métodos. Se reemplaza por uno en memoria por archivo.
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => { data.delete(k); },
    setItem: (k, v) => { data.set(k, String(v)); },
  };
}

for (const name of ['localStorage', 'sessionStorage'] as const) {
  if (typeof globalThis[name]?.getItem !== 'function') {
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: memoryStorage() });
  }
}

Object.defineProperty(URL, 'revokeObjectURL', {
  configurable: true,
  writable: true,
  value: vi.fn(),
});
