import { describe, it, expect, beforeEach } from 'vitest';
import { loadFreshchatScript, resetScriptLoader } from '../../src/utils/loader';

describe('loader', () => {
  beforeEach(() => {
    resetScriptLoader();
    document.querySelectorAll('script[data-freshchat]').forEach(el => el.remove());
  });

  it('should append a script tag to document.head', async () => {
    const promise = loadFreshchatScript('https://wchat.freshchat.com');

    const script = document.querySelector('script[data-freshchat]') as HTMLScriptElement;
    expect(script).not.toBeNull();
    expect(script.src).toContain('/js/widget.js');
    expect(script.async).toBe(true);

    // Simulate load
    script.onload?.(new Event('load'));
    await promise;
  });

  it('should return the same promise on subsequent calls', () => {
    const p1 = loadFreshchatScript('https://wchat.freshchat.com');
    const p2 = loadFreshchatScript('https://wchat.freshchat.com');
    expect(p1).toBe(p2);
  });

  it('should resolve immediately if script tag already exists', async () => {
    const existing = document.createElement('script');
    existing.setAttribute('data-freshchat', 'true');
    document.head.appendChild(existing);

    await loadFreshchatScript('https://wchat.freshchat.com');
    // No error means it resolved
  });
});
