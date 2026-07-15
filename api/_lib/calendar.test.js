import { describe, it, expect } from 'vitest';
import { collectBusyInstants } from './calendar.js';

const A = 'a@group.calendar.google.com';
const B = 'b@group.calendar.google.com';
const slot = (start, end) => ({ start, end });

describe('collectBusyInstants — refuses to vouch for data it does not have', () => {
  it('throws when a calendar reports errors (un-shared / deleted / ACL downgraded)', () => {
    const cals = { [A]: { errors: [{ reason: 'notFound' }] } };
    expect(() => collectBusyInstants(cals, [A])).toThrow(/notFound/);
    expect(() => collectBusyInstants(cals, [A])).toThrow(new RegExp(A));
  });

  it('throws when a requested calendar is missing from the response entirely', () => {
    expect(() => collectBusyInstants({}, [A])).toThrow(/missing from free\/busy response/);
  });

  it('throws when no calendars were requested (GOOGLE_CALENDAR_ID unset)', () => {
    // The per-ID loop cannot catch this: it iterates nothing, finds nothing wrong,
    // and would report every slot free.
    expect(() => collectBusyInstants({}, [])).toThrow(/GOOGLE_CALENDAR_ID is not set/);
  });

  it('throws if ANY calendar is broken, even when another returned cleanly', () => {
    // Partial busy data is worse than an error: it silently under-reports.
    const cals = {
      [A]: { busy: [slot('2026-07-20T08:00:00Z', '2026-07-20T09:00:00Z')] },
      [B]: { errors: [{ reason: 'forbidden' }] },
    };
    expect(() => collectBusyInstants(cals, [A, B])).toThrow(/forbidden/);
  });

  it('names every broken calendar, not just the first', () => {
    const cals = { [A]: { errors: [{ reason: 'notFound' }] } };
    const run = () => collectBusyInstants(cals, [A, B]);
    expect(run).toThrow(new RegExp(A));
    expect(run).toThrow(new RegExp(B));
  });

  it('tolerates an errors entry with no reason', () => {
    const cals = { [A]: { errors: [{}] } };
    expect(() => collectBusyInstants(cals, [A])).toThrow(/unknown/);
  });

  it('throws on a null/undefined calendars object', () => {
    expect(() => collectBusyInstants(null, [A])).toThrow(/missing from free\/busy response/);
    expect(() => collectBusyInstants(undefined, [A])).toThrow(/missing from free\/busy response/);
  });
});

describe('collectBusyInstants — healthy responses parse unchanged', () => {
  it('returns the busy instants for a single calendar', () => {
    const busy = [slot('2026-07-20T08:00:00Z', '2026-07-20T09:00:00Z')];
    expect(collectBusyInstants({ [A]: { busy } }, [A])).toEqual(busy);
  });

  it('unions busy instants across all requested calendars', () => {
    const cals = {
      [A]: { busy: [slot('2026-07-20T08:00:00Z', '2026-07-20T09:00:00Z')] },
      [B]: { busy: [slot('2026-07-20T13:00:00Z', '2026-07-20T14:00:00Z')] },
    };
    expect(collectBusyInstants(cals, [A, B])).toEqual([
      slot('2026-07-20T08:00:00Z', '2026-07-20T09:00:00Z'),
      slot('2026-07-20T13:00:00Z', '2026-07-20T14:00:00Z'),
    ]);
  });

  it('treats an error-free entry with no busy key as free, NOT as a failure', () => {
    // Google omits empty arrays. Throwing here would flag every quiet day as an outage —
    // a self-inflicted outage strictly worse than the bug this function exists to fix.
    expect(collectBusyInstants({ [A]: {} }, [A])).toEqual([]);
  });

  it('treats an empty errors array as healthy', () => {
    expect(collectBusyInstants({ [A]: { errors: [], busy: [] } }, [A])).toEqual([]);
  });

  it('ignores calendars present in the response but never requested', () => {
    const cals = {
      [A]: { busy: [slot('2026-07-20T08:00:00Z', '2026-07-20T09:00:00Z')] },
      [B]: { busy: [slot('2026-07-20T13:00:00Z', '2026-07-20T14:00:00Z')] },
    };
    expect(collectBusyInstants(cals, [A])).toEqual([
      slot('2026-07-20T08:00:00Z', '2026-07-20T09:00:00Z'),
    ]);
  });
});
