import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Technician } from '@/types';
import { runResilientRequest } from '@/lib/resilientRequest';

const TECHNICIANS_CACHE_TTL_MS = 5 * 60_000;

let techniciansCache: Technician[] | null = null;
let techniciansCacheAt = 0;

function sortTechnicians(items: Technician[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'it'));
}

function commitTechniciansCache(nextTechnicians: Technician[]) {
  const sorted = sortTechnicians(nextTechnicians);
  techniciansCache = sorted;
  techniciansCacheAt = Date.now();
  return sorted;
}

export function invalidateTechniciansCache() {
  techniciansCache = null;
  techniciansCacheAt = 0;
}

async function loadTechniciansFromApi() {
  const { data, error } = await runResilientRequest(
    (signal) => supabase
      .from('technicians')
      .select('*, supplier:suppliers(id, name)')
      .order('name')
      .abortSignal(signal),
    {
      label: 'technicians fetch',
      timeoutMessage: 'Timeout durante il caricamento dei tecnici',
    }
  );

  if (error) {
    throw error;
  }

  return commitTechniciansCache(data ?? []);
}

export function useTechnicians(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(enabled && !techniciansCache);

  const fetchTechnicians = useCallback(async (force = false) => {
    if (!enabled) {
      setLoading(false);
      return [];
    }

    const hasFreshCache = techniciansCache && Date.now() - techniciansCacheAt < TECHNICIANS_CACHE_TTL_MS;

    if (!force && techniciansCache) {
      setTechnicians(techniciansCache);
      setLoading(false);
      if (hasFreshCache) return techniciansCache;
    } else {
      setLoading(true);
    }

    const freshTechnicians = await loadTechniciansFromApi();
    setTechnicians(freshTechnicians);
    setLoading(false);
    return freshTechnicians;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setTechnicians([]);
      setLoading(false);
      return;
    }

    fetchTechnicians().catch((error) => {
      console.error('Technicians fetch error', error);
      setLoading(false);
    });
  }, [enabled, fetchTechnicians]);

  const createTechnician = async (payload: Omit<Technician, 'id' | 'created_at' | 'supplier'>) => {
    const { data, error } = await runResilientRequest(
      (signal) => supabase.from('technicians').insert(payload).select('*, supplier:suppliers(id, name)').abortSignal(signal).single(),
      {
        label: 'technician create',
        timeoutMessage: 'Timeout durante il salvataggio del tecnico',
      }
    );
    if (!error && data) {
      const nextTechnicians = commitTechniciansCache([...(techniciansCache ?? []), data]);
      setTechnicians(nextTechnicians);
    }
    return { data, error };
  };

  const updateTechnician = async (id: string, payload: Partial<Technician>) => {
    const { error } = await runResilientRequest(
      (signal) => supabase.from('technicians').update(payload).eq('id', id).abortSignal(signal),
      {
        label: 'technician update',
        timeoutMessage: 'Timeout durante l\'aggiornamento del tecnico',
      }
    );
    if (!error) {
      const nextTechnicians = commitTechniciansCache(
        (techniciansCache ?? []).map((technician) =>
          technician.id === id
            ? {
                ...technician,
                ...payload,
              }
            : technician
        )
      );
      setTechnicians(nextTechnicians);
    }
    return { error, data: null };
  };

  const deleteTechnician = async (id: string) => {
    const { error } = await runResilientRequest(
      (signal) => supabase.from('technicians').delete().eq('id', id).abortSignal(signal),
      {
        label: 'technician delete',
        timeoutMessage: 'Timeout durante l\'eliminazione del tecnico',
      }
    );
    if (!error) {
      const nextTechnicians = commitTechniciansCache((techniciansCache ?? []).filter((technician) => technician.id !== id));
      setTechnicians(nextTechnicians);
    }
    return { error };
  };

  return { technicians, loading, fetchTechnicians, createTechnician, updateTechnician, deleteTechnician };
}
