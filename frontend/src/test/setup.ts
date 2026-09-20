import '@testing-library/jest-dom';
import { vi } from 'vitest';

// JSDOM does not implement object URLs. Browser-facing print/download helpers
// depend on them, so provide deterministic test doubles globally.
Object.defineProperty(URL, 'createObjectURL', {
  configurable: true,
  writable: true,
  value: vi.fn(() => 'blob:test-object-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  configurable: true,
  writable: true,
  value: vi.fn(),
});
