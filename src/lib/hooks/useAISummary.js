import { useState, useEffect } from 'react';

export function useAISummary(dauid, persona = 'resident') {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [refreshCount, setRefreshCount] = useState(0);

    useEffect(() => {
        if (!dauid) return;

        let cancelled = false;
        setLoading(true);
        setError(null);

        fetch('/api/ai/da-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dauid,
                persona,
                regenerate: refreshCount > 0,
            }),
        })
            .then(res => res.json())
            .then(data => {
                if (cancelled) return;
                setData(data.summary);
                setLoading(false);
            })
            .catch(error => {
                if (cancelled) return;
                setError(error);
                setLoading(false);
            });

        return () => { cancelled = true; };
    }, [dauid, persona, refreshCount]);

    function regenerate() {
        setRefreshCount(c => c + 1);
    }

    return { data, loading, error, regenerate };
}