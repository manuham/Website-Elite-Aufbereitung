import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchAvailabilityRange } from '../lib/api';
import { isoKey } from '../lib/scheduling';

/**
 * Loads busy intervals for the visible week (Mon→Sun) and polls every 30 s so a
 * slot taken by someone else disappears live.
 *
 * @param weekStart  Date — Monday of the visible week
 * @param days       number of days to load (default 7)
 * @param active     poll only while true
 * @returns { busyByIso, loading, isFallback, refresh }
 *          busyByIso: { 'YYYY-MM-DD': [[startMin,endMin], …] }
 */
export function useWeekAvailability(weekStart, days = 7, active = true) {
  const [busyByIso, setBusyByIso] = useState({});
  const [loading, setLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const intervalRef = useRef(null);
  const abortRef = useRef(null);

  const startString = weekStart ? isoKey(weekStart) : null;

  const toMap = useCallback((daysBusy) => {
    const map = {};
    for (const d of daysBusy || []) map[d.date] = d.closed ? [] : (d.busy || []);
    return map;
  }, []);

  const load = useCallback(async (showLoading) => {
    if (!startString) return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    if (showLoading) setLoading(true);
    try {
      const data = await fetchAvailabilityRange(startString, days, abortRef.current.signal);
      setBusyByIso(toMap(data.daysBusy));
      setIsFallback(!!data.fallback);
    } catch (e) {
      if (e.name !== 'AbortError') {
        // Keep whatever we had; flag fallback so the UI can warn.
        setIsFallback(true);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [startString, days, toMap]);

  // Initial / week-change load
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

  return { busyByIso, loading, isFallback, refresh: () => load(true) };
}
