import { describe, it, expect } from 'vitest';
import { detectCurrentDevice } from '../device';

describe('utils/device', () => {
  it('detects Windows and Chrome correctly', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    const info = detectCurrentDevice(ua);
    expect(info.os).toBe('Windows');
    expect(info.browser).toBe('Chrome');
    expect(info.iconType).toBe('laptop');
    expect(info.device).toBe('Windows • Chrome');
  });

  it('detects macOS and Safari correctly', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
    const info = detectCurrentDevice(ua);
    expect(info.os).toBe('macOS');
    expect(info.browser).toBe('Safari');
    expect(info.iconType).toBe('laptop');
  });

  it('detects iOS and Mobile Safari on iPhone', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    const info = detectCurrentDevice(ua);
    expect(info.os).toBe('iOS');
    expect(info.iconType).toBe('smartphone');
  });

  it('detects Microsoft Edge on Windows', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
    const info = detectCurrentDevice(ua);
    expect(info.browser).toBe('Microsoft Edge');
  });

  it('detects Firefox on Linux', () => {
    const ua = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0';
    const info = detectCurrentDevice(ua);
    expect(info.os).toBe('Linux');
    expect(info.browser).toBe('Firefox');
  });
});
