import { useState, useEffect } from 'react';

export const useLocation = () => {
  // Default coordinates (Colombo / Sri Lanka emergency operations base)
  const [location, setLocation] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
    accuracy: 10
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const requestLocation = () => {
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (isMounted) {
              setLocation({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy
              });
              setLoading(false);
            }
          },
          (err) => {
            console.warn('[useLocation] Geolocation permission or lookup issue:', err.message);
            if (isMounted) {
              setError(err.message);
              setLoading(false);
            }
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    requestLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshLocation = () => {
    setLoading(true);
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          });
          setLoading(false);
        },
        () => setLoading(false),
        { enableHighAccuracy: true }
      );
    } else {
      setLoading(false);
    }
  };

  return { location, loading, error, refreshLocation };
};
