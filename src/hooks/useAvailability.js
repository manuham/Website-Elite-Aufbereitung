import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchAvailability } from '../lib/api';

const FALLBACK_WEEKDAY = ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00'];
const FALLBACK_SATURDAY = ['08:00', '09:30', '11:00', '12:30'];

function toDateString(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function useAvailability(selectedDate, active = false) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const intervalRef = useRef(null);
  const abortRef = useRef(null);

  const loadSlots = useCallback(async (date) => {
    if (!date) {
      setSlots([]);
      return;
    }

    const dateString = toDateString(date);

    setLoading(true);
    setIsFallback(false);

    try {
      const data = await fetchAvailability(dateString);
      setSlots(data.slots);
      setIsFallback(!!data.fallback);
    } catch {
      // Graceful degradation: show all slots if API fails
      const dow = date.getDay();
      if (dow === 0) {
        setSlots([]);
      } else if (dow === 6) {
        setSlots(FALLBACK_SATURDAY);
      } else {
        setSlots(FALLBACK_WEEKDAY);
      }
      setIsFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Silent poll — no loading state change, won't cause skeleton flash
  const silentPoll = useCallback(async (date) => {
    if (!date) return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    try {
      const data = await fetchAvailability(toDateString(date), abortRef.current.signal);
      setSlots(prev => {
        const next = data.slots;
        return JSON.stringify(next) === JSON.stringify(prev) ? prev : next;
      });
      setIsFallback(!!data.fallback);
    } catch (e) {
      if (e.name !== 'AbortError') {
        // Keep existing slots on poll error — don't degrade to fallback
      }
    }
  }, []);

  // Polling setup/teardown — only runs when active=true and a date is selected
  useEffect(() => {
    if (!active || !selectedDate) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    intervalRef.current = setInterval(() => silentPoll(selectedDate), 30_000);
    return () => {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (abortRef.current) abortRef.current.abort();
    };
  }, [active, selectedDate, silentPoll]);

  // Initial load when date changes
  useEffect(() => {
    loadSlots(selectedDate);
  }, [selectedDate, loadSlots]);

  return { slots, loading, isFallback, refresh: () => loadSlots(selectedDate) };
}
