import { useEffect, useState} from "react";

export function useTransitStops() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        fetch('/api/transit-stops')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch transit stops');
                }
                return response.json();
            })
            .then(data => {
                if (!cancelled) {
                    setData(data);
                    setLoading(false);
                }
            })
            .catch(error => {
                if (!cancelled) {
                    setError(error);
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return { data, loading, error };

}