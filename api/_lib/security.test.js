import { describe, it, expect } from 'vitest';
import {
  isIsoDate, isHmTime, isEmail, isPhone,
  cleanStr, cleanMultiline, sanitizePhotoUrls, rateLimit,
} from './security.js';

describe('validators', () => {
  it('isIsoDate', () => {
    expect(isIsoDate('2026-07-06')).toBe(true);
    expect(isIsoDate('2026-7-6')).toBe(false);
    expect(isIsoDate('not-a-date')).toBe(false);
    expect(isIsoDate(123)).toBe(false);
  });
  it('isHmTime', () => {
    expect(isHmTime('09:30')).toBe(true);
    expect(isHmTime('23:59')).toBe(true);
    expect(isHmTime('24:00')).toBe(false);
    expect(isHmTime('9:30')).toBe(false);
  });
  it('isEmail', () => {
    expect(isEmail('max@mustermann.at')).toBe(true);
    expect(isEmail('nope')).toBe(false);
    expect(isEmail('a@b')).toBe(false);
  });
  it('isPhone', () => {
    expect(isPhone('+43 664 000 0000')).toBe(true);
    expect(isPhone('abc')).toBe(false);
    expect(isPhone('123')).toBe(false); // too short
  });
});

describe('sanitisation', () => {
  it('cleanStr strips CR/LF (field-injection) and clamps length', () => {
    // CR and LF are each replaced with a space, so no line-break survives to forge fields.
    expect(cleanStr('Max\r\nBezahlt: JA', 100)).toBe('Max  Bezahlt: JA');
    expect(cleanStr('Max\r\nBezahlt: JA', 100)).not.toMatch(/[\r\n]/);
    expect(cleanStr('abcdef', 3)).toBe('abc');
    expect(cleanStr(undefined, 10)).toBe('');
  });
  it('cleanMultiline keeps newlines but drops CR and other control chars', () => {
    expect(cleanMultiline('line1\r\nline2', 100)).toBe('line1\nline2');
    expect(cleanMultiline('a\tb', 100)).toBe('a b'); // tab -> space
  });
  it('sanitizePhotoUrls keeps only https cloudinary URLs on our cloud', () => {
    const urls = [
      'https://res.cloudinary.com/ddtmjszd6/image/upload/v1/a.jpg', // ok
      'http://res.cloudinary.com/ddtmjszd6/image/upload/b.jpg',     // not https
      'https://evil.com/x.jpg',                                     // wrong host
      'https://res.cloudinary.com/other/c.jpg',                     // wrong cloud
      'javascript:alert(1)',                                        // junk
    ];
    expect(sanitizePhotoUrls(urls, { cloudName: 'ddtmjszd6' })).toEqual([
      'https://res.cloudinary.com/ddtmjszd6/image/upload/v1/a.jpg',
    ]);
  });
  it('sanitizePhotoUrls caps count and handles non-arrays', () => {
    const many = Array.from({ length: 10 }, (_, i) => `https://res.cloudinary.com/c/${i}.jpg`);
    expect(sanitizePhotoUrls(many, { cloudName: 'c', max: 4 })).toHaveLength(4);
    expect(sanitizePhotoUrls('nope')).toEqual([]);
  });
});

describe('rateLimit', () => {
  it('allows up to max then blocks within the window', () => {
    const t0 = 1_000_000;
    expect(rateLimit('k1', 2, 1000, t0)).toBe(true);
    expect(rateLimit('k1', 2, 1000, t0)).toBe(true);
    expect(rateLimit('k1', 2, 1000, t0)).toBe(false); // 3rd blocked
  });
  it('resets after the window elapses', () => {
    const t0 = 2_000_000;
    expect(rateLimit('k2', 1, 1000, t0)).toBe(true);
    expect(rateLimit('k2', 1, 1000, t0)).toBe(false);
    expect(rateLimit('k2', 1, 1000, t0 + 1001)).toBe(true); // new window
  });
});
