import { useState, useEffect } from 'react';
import api from '../api/axios';

/**
 * Custom hook to fetch all diamond configuration attributes (colors, shapes, clarities, types, cuts, sizes)
 * from a single combined API endpoint (/diamonds/options), eliminating multiple parallel network requests.
 */
export default function useDiamondLookup() {
  const [data, setData] = useState({
    colors: [],
    clarities: [],
    shapes: [],
    types: [],
    cuts: [],
    sizes: [],
    metalColors: [],
    metalPurities: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDiamondOptions = async () => {
      try {
        setLoading(true);
        const res = await api.get('/diamonds/attributes');

        const payload = res.data?.data || {};
        if (isMounted) {
          setData({
            colors: payload.colors || payload.diamondColors || [],
            clarities: payload.clarities || payload.diamondClarities || [],
            shapes: payload.shapes || payload.diamondShapes || [],
            types: payload.types || payload.diamondTypes || [],
            cuts: payload.cuts || payload.diamondCuts || [],
            sizes: payload.sizes || payload.diamondSizes || [],
            metalColors: payload.metalColors || [],
            metalPurities: payload.metalPurities || [],
          });
          setError(null);
        }
      } catch (err) {
        console.warn('Failed to fetch combined diamond options:', err);
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDiamondOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    ...data,
    loading,
    error,
    // Formatted dropdown options for convenience
    colorOptions: (data.colors || []).map((c) => ({ value: c._id || c.name, label: c.name })),
    shapeOptions: (data.shapes || []).map((s) => ({ value: s._id || s.name, label: s.name })),
    clarityOptions: (data.clarities || []).map((cl) => ({ value: cl._id || cl.name, label: cl.name })),
    typeOptions: (data.types || []).map((t) => ({ value: t._id || t.name, label: t.name })),
  };
}
