import { useEffect, useState } from 'react';
import { sessionsApi } from '../api/sessions';

/**
 * Polls for active sessions and returns the count.
 * Only fetches when `enabled` is true (i.e. for student users).
 */
export function useActiveSessionCount(enabled: boolean, intervalMs = 30_000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const fetch = () => {
      sessionsApi.listActive().then((sessions) => {
        if (!cancelled) setCount(sessions.length);
      }).catch(() => {/* ignore */});
    };

    fetch();
    const id = setInterval(fetch, intervalMs);
    return () => { cancelled = true; clearInterval(id); };
  }, [enabled, intervalMs]);

  return count;
}
