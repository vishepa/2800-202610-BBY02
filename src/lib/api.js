import { useEffect, useState } from "react";

export function getIsochroneData() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {

        let cancelled = false;

        fetch('/api/')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (cancelled) return;
                setData(data);
                setLoading(false);
                
            })
            .catch(error => {
                if (cancelled) return;
                setError(error);
                setLoading(false);
            });

        return () => { cancelled = true; };

    }, []);

    return { data, loading, error };
}
