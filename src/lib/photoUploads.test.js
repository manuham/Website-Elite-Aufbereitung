import { describe, it, expect } from 'vitest';
import { summarizePhotoUploads } from './photoUploads.js';

const ok = (url) => ({ status: 'fulfilled', value: url });
const fail = (msg = 'Upload fehlgeschlagen') => ({ status: 'rejected', reason: new Error(msg) });

const A = 'https://res.cloudinary.com/ddtmjszd6/image/upload/v1/a.jpg';
const B = 'https://res.cloudinary.com/ddtmjszd6/image/upload/v1/b.jpg';

describe('summarizePhotoUploads — a failed photo must never cost the booking', () => {
  it('no photos → nothing to warn about (unchanged behaviour)', () => {
    expect(summarizePhotoUploads([])).toEqual({ urls: [], failed: 0, total: 0, warning: null });
  });

  it('all photos succeed → no warning', () => {
    const s = summarizePhotoUploads([ok(A), ok(B)]);
    expect(s.urls).toEqual([A, B]);
    expect(s.failed).toBe(0);
    expect(s.warning).toBeNull();
  });

  it('some fail → keeps the survivors AND warns', () => {
    // The old Promise.all threw away A as well, then aborted the whole booking.
    const s = summarizePhotoUploads([ok(A), fail(), ok(B)]);
    expect(s.urls).toEqual([A, B]);
    expect(s.failed).toBe(1);
    expect(s.warning).toMatch(/1 von 3/);
  });

  it('all fail → no urls, but still a booking', () => {
    const s = summarizePhotoUploads([fail(), fail()]);
    expect(s.urls).toEqual([]);
    expect(s.failed).toBe(2);
    expect(s.warning).toBeTruthy();
  });

  it('every warning reassures that the booking arrived', () => {
    // A warning that only reports the photo failure reads as "your booking failed".
    for (const results of [[fail()], [fail(), fail()], [ok(A), fail()], [ok(A), fail(), fail()]]) {
      expect(summarizePhotoUploads(results).warning).toMatch(/Buchung ist aber angekommen/);
    }
  });

  it('uses singular German for a single lost photo', () => {
    expect(summarizePhotoUploads([fail()]).warning).toMatch(/^Ihr Foto konnte/);
    expect(summarizePhotoUploads([fail(), fail()]).warning).toMatch(/^Ihre Fotos konnten/);
  });

  it('never blames the customer or asks for a blind retry', () => {
    // The old copy said "Bitte versuchen Sie es erneut" while the real fix was to remove the
    // photos — which it never said, so customers retried into the same wall.
    for (const results of [[fail()], [ok(A), fail()], [fail(), fail(), fail()]]) {
      expect(summarizePhotoUploads(results).warning).not.toMatch(/erneut/);
    }
  });

  it('urls stay in order, so they still line up with what was picked', () => {
    expect(summarizePhotoUploads([ok(A), fail(), ok(B)]).urls).toEqual([A, B]);
  });
});
