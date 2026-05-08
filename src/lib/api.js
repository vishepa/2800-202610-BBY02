import { useState, useEffect } from "react";

export function useIsochrones(range_seconds) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const url = new URL("/api/isochrones?source_type=transit_stop", window.location.origin);
    if (range_seconds) {
      url.searchParams.set("range_seconds", range_seconds);
    }

    setLoading(true);
    setError(null);

    fetch(url.toString())
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [range_seconds]);

  return { data, loading, error };
}