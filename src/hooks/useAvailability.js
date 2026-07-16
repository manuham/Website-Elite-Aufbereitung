import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { fetchAvailabilityRange } from '../lib/api';
import { makeAvailability, isoKey, HORIZON_DAYS } from '../lib/scheduling';

/**
 * Loads busy intervals for one contiguous horizon starting at `start`, and polls every 30 s so a
 * slot taken by someone else disappears live.
 *
 * ONE range, replaced wholesale — deliberately no merging across ranges. Wholesale replace is what
 * makes coverage correct by construction: every key in the map came from the same fetch instant, so
 * "present" always means "fetched just now". A merged map would either have to re-poll the whole
 * merged span (identical to widening this range, with more code) or let off-poll days rot and then
 * evict them back to unknown. The server issues exactly one Google freebusy.query per request
 * regardless of span, so a wide range is cheaper than several narrow ones.
 *
 * @param start   Date — first day of the horizon (normally today)
 * @param days    number of days to load
 * @param active  poll only while true
 * @returns { avail, busyByIso, loading, hasLoaded, isFallback, isStale, refresh }
 *   avail       — coverage-aware wrapper; ask it, never busyByIso directly
 *   loading     — a fetch is in flight (true on first render, before anything is known)
 *   hasLoaded   — a response has landed at least once; gate skeletons on this, not on `loading`
 *   isFallback  — the server could not reach Google and returned a fabricated working-hours
 *                 skeleton. The map holds data that LOOKS free but was never checked, so `avail`
 *                 reports every day unknown.
 *   isStale     — the fetch itself failed. No new data; the map still holds real, slightly old
 *                 data. Distinct from isFallback: one flaky poll must not blank a working calendar.
 */
export function useAvailability(start, days = HORIZON_DAYS, active = true) {
  const [busyByIso, setBusyByIso] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const intervalRef = useRef(null);
  const abortRef = useRef(null);

  const startString = start ? isoKey(start) : null;

  const load = useCallback(async (showLoading) => {
    if (!startString) return;
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    // Only the newest request may write state. A superseded one must stay silent: its `finally`
    // would otherwise clear `loading` while its replacement is still in flight, and the calendar
    // would drop its "lädt" placeholders and render every not-yet-known day as bookable — exactly
    // the fabricated availability this whole change exists to remove.
    const current = () => abortRef.current === ctrl;
    if (showLoading) setLoading(true);
    try {
      const data = await fetchAvailabilityRange(startString, days, ctrl.signal);
      if (!current()) return;
      const map = {};
      for (const d of data.daysBusy || []) map[d.date] = d.closed ? [] : (d.busy || []);
      setBusyByIso(map);
      setIsFallback(!!data.fallback);
      setIsStale(false);
      setHasLoaded(true);
    } catch (e) {
      if (e.name !== 'AbortError' && current()) {
        // Keep whatever we had — it is still real data, just older. Do NOT set isFallback:
        // that flag means "the server handed us fabricated availability", which is a different
        // and much more dangerous failure.
        setIsStale(true);
      }
    } finally {
      if (showLoading && current()) setLoading(false);
    }
  }, [startString, days]);

  // Initial / horizon-change load
  useEffect(() => { load(true); }, [load]);

  // Polling
  useEffect(() => {
    if (!active || !startString) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    intervalRef.current = setInterval(() => load(false), 30_000);
    return () => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (abortRef.current) abortRef.current.abort();
    };
  }, [active, startString, load]);

  // A fallback response is not knowledge: mark the whole map unknown rather than let a
  // fabricated skeleton be read back to the customer as availability.
  const avail = useMemo(
    () => makeAvailability(busyByIso, { trusted: hasLoaded && !isFallback }),
    [busyByIso, hasLoaded, isFallback],
  );

  return { avail, busyByIso, loading, hasLoaded, isFallback, isStale, refresh: () => load(true) };
}
