import { useEffect, useRef } from 'react';

export function useRecurringTask(
  callback: () => Promise<void> | void,
  delayMs: number,
  enabled = true,
  deps: unknown[] = [],
) {
  const callbackRef = useRef(callback);
  const timerRef = useRef<number | null>(null);

  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let inFlight = false;

    const scheduleNext = () => {
      if (cancelled) return;
      timerRef.current = window.setTimeout(() => {
        void run();
      }, delayMs);
    };

    const run = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      try {
        await callbackRef.current();
      } finally {
        inFlight = false;
        scheduleNext();
      }
    };

    void run();

    return () => {
      cancelled = true;
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, delayMs, ...deps]);
}
