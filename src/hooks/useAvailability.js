import { useState, useEffect, useCallback } from 'react';
import { fetchAvailability } from '../lib/api';

const FALLBACK_WEEKDAY = ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00'];
const FALLBACK_SATURDAY = ['08:00', '09:30', '11:00', '12:30'];

export function useAvailability(selectedDate) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  const loadSlots = useCallback(async (date) => {
    if (!date) {
      setSlots([]);
      return;
    }

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateString = `${yyyy}-${mm}-${dd}`;

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

  useEffect(() => {
    loadSlots(selectedDate);
  }, [selectedDate, loadSlots]);

  return { slots, loading, isFallback, refresh: () => loadSlots(selectedDate) };
}
