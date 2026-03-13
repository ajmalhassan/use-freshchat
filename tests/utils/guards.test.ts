import { describe, it, expect } from 'vitest';
import { isBrowser, withBrowser, getFcWidget } from '../../src/utils/guards';

describe('guards', () => {
  describe('isBrowser', () => {
    it('should be true in jsdom environment', () => {
      expect(isBrowser).toBe(true);
    });
  });

  describe('withBrowser', () => {
    it('should execute the function in browser environment', () => {
      const result = withBrowser(() => 42);
      expect(result).toBe(42);
    });

    it('should return the result of the function', () => {
      const result = withBrowser(() => 'hello');
      expect(result).toBe('hello');
    });
  });

  describe('getFcWidget', () => {
    it('should return undefined when fcWidget is not on window', () => {
      expect(getFcWidget()).toBeUndefined();
    });
  });
});
