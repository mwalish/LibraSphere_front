import { useEffect, useState, useSyncExternalStore } from "react";
import { getVersion, subscribe } from "../api/client";

/** Fetch on mount, when deps change, and after ANY write anywhere in the app. */
export function useApi(fn, deps = []) {
  const version = useSyncExternalStore(subscribe, getVersion);
  const [state, setState] = useState({ data: null, loading: true, error: null });
  useEffect(() => {
    let stale = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => !stale && setState({ data, loading: false, error: null }))
      .catch((error) => !stale && setState((s) => ({ ...s, loading: false, error })));
    return () => { stale = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);
  return state;
}
