import { useState, useCallback, useEffect } from 'react';

// Client-side cache persists across DA switches
const summaryCache = new Map();

export function useAISummary(dauid, persona = 'resident') {
    const cacheKey = `${dauid}-${persona}`;
    const [data, setData] = useState(() => summaryCache.get(cacheKey) || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // When DA or persona changes, restore from cache or reset
    useEffect(() => {
        const cached = summaryCache.get(cacheKey);
        setData(cached || null);
        setLoading(false);
        setError(null);
    }, [cacheKey]);

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
                summaryCache.set(cacheKey, data.summary);
                setData(data.summary);
                setLoading(false);
            })
            .catch(error => {
                setError(error);
                setLoading(false);
            });
    }, [dauid, persona, cacheKey]);

    function regenerate() {
        generate(true);
    }

    return { data, loading, error, generate, regenerate };
}
