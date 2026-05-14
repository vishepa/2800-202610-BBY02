import { useState, useCallback } from 'react';

export function useAISummary(dauid, persona = 'resident') {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const generate = useCallback((isRegenerate = false) => {
        if (!dauid) return;

        setLoading(true);
        setError(null);

        fetch('/api/ai/da-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dauid,
                persona,
                regenerate: isRegenerate,
            }),
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to generate summary');
                return res.json();
            })
            .then(data => {
                setData(data.summary);
                setLoading(false);
            })
            .catch(error => {
                setError(error);
                setLoading(false);
            });
    }, [dauid, persona]);

    function regenerate() {
        generate(true);
    }

    return { data, loading, error, generate, regenerate };
}
