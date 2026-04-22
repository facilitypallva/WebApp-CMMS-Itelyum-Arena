import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Location } from '@/types';
import { runResilientRequest } from '@/lib/resilientRequest';

const LOCATIONS_CACHE_TTL_MS = 5 * 60_000;

let locationsCache: Location[] | null = null;
let locationsCacheAt = 0;

async function loadLocationsFromApi() {
  const { data, error } = await runResilientRequest(
    (signal) => supabase
      .from('locations')
      .select('*')
      .order('name')
      .abortSignal(signal),
    {
      label: 'locations fetch',
      timeoutMessage: 'Timeout durante il caricamento delle ubicazioni',
    }
  );

  if (error) {
    throw error;
  }

  const nextData = data ?? [];
  locationsCache = nextData;
  locationsCacheAt = Date.now();
  return nextData;
}

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(!locationsCache);

  const fetchLocations = useCallback(async (force = false) => {
    const hasFreshCache = locationsCache && Date.now() - locationsCacheAt < LOCATIONS_CACHE_TTL_MS;

    if (!force && locationsCache) {
      setLocations(locationsCache);
      setLoading(false);
      if (hasFreshCache) return locationsCache;
    } else {
      setLoading(true);
    }

    try {
      const freshLocations = await loadLocationsFromApi();
      setLocations(freshLocations);
      setLoading(false);
      return freshLocations;
    } catch (error) {
      console.error('Failed to load locations', error);
      setLocations([]);
      setLoading(false);
      throw error;
    }
  }, []);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  return { locations, loading, fetchLocations };
}
