import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, call } from "./api";
import { useSignedIn } from "./session";

/**
 * Loads an API path and reloads it whenever the screen comes back into focus. With `pollMs`,
 * it also refreshes on a timer while the screen is focused (live campaigns).
 */
export function useApi<T>(path: string, { pollMs }: { pollMs?: number } = {}) {
  const { session, signOut } = useSignedIn();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const alive = useRef(true);

  const load = useCallback(
    async (manual = false) => {
      if (manual) setRefreshing(true);
      try {
        const next = await call<T>(session, path);
        if (alive.current) {
          setData(next);
          setError(null);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return signOut({ tellServer: false });
        if (alive.current) setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        if (alive.current && manual) setRefreshing(false);
      }
    },
    [session, path, signOut],
  );

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      if (!pollMs) return;
      const t = setInterval(() => load(), pollMs);
      return () => clearInterval(t);
    }, [load, pollMs]),
  );

  return { data, error, refreshing, reload: () => load(true) };
}
