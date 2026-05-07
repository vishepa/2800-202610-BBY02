import { useEffect, useState } from "react";



export function useFoodAssets() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {

        let cancelled = false;

        fetch('/api/food-assets')
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


// const SAMPLE_DATA = {
//   type: 'FeatureCollection',
//   features: [
//     {
//       type: 'Feature',
//       geometry: { type: 'Point', coordinates: [-123.1207, 49.2827] },
//       properties: { name: 'Sample Supermarket', type: 'Supermarket', address: '123 Main St' },
//     },
//     {
//       type: 'Feature',
//       geometry: { type: 'Point', coordinates: [-123.1100, 49.2750] },
//       properties: { name: 'Sample Kitchen Access', type: 'Kitchen Access', address: '456 Oak Ave' },
//     },
//     {
//       type: 'Feature',
//       geometry: { type: 'Point', coordinates: [-123.0980, 49.2680] },
//       properties: { name: 'Sample Community Garden', type: 'Community Garden', address: '789 Pine Rd' },
//     },
//     {
//       type: 'Feature',
//       geometry: { type: 'Point', coordinates: [-123.1050, 49.2870] },
//       properties: { name: 'Sample Free Meal', type: 'Free Meal', address: '321 Elm St' },
//     },
//     {
//       type: 'Feature',
//       geometry: { type: 'Point', coordinates: [-123.1300, 49.2700] },
//       properties: { name: 'Sample Low-Cost Meal', type: 'Low Cost Meal', address: '654 Maple Dr' },
//     },
//   ],
// };