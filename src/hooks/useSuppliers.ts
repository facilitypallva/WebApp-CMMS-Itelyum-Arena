import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Supplier } from '@/types';
import { runResilientRequest } from '@/lib/resilientRequest';

const SUPPLIERS_CACHE_TTL_MS = 5 * 60_000;

let suppliersCache: Supplier[] | null = null;
let suppliersCacheAt = 0;

function sortSuppliers(items: Supplier[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'it'));
}

function commitSuppliersCache(nextSuppliers: Supplier[]) {
  const sorted = sortSuppliers(nextSuppliers);
  suppliersCache = sorted;
  suppliersCacheAt = Date.now();
  return sorted;
}

async function loadSuppliersFromApi() {
  const { data, error } = await runResilientRequest(
    (signal) => supabase
      .from('suppliers')
      .select('*')
      .order('name')
      .abortSignal(signal),
    {
      label: 'suppliers fetch',
      timeoutMessage: 'Timeout durante il caricamento dei fornitori',
    }
  );

  if (error) {
    throw error;
  }

  return commitSuppliersCache(data ?? []);
}

export function useSuppliers(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(enabled && !suppliersCache);

  const fetchSuppliers = useCallback(async (force = false) => {
    if (!enabled) {
      setLoading(false);
      return [];
    }

    const hasFreshCache = suppliersCache && Date.now() - suppliersCacheAt < SUPPLIERS_CACHE_TTL_MS;

    if (!force && suppliersCache) {
      setSuppliers(suppliersCache);
      setLoading(false);
      if (hasFreshCache) return suppliersCache;
    } else {
      setLoading(true);
    }

    const freshSuppliers = await loadSuppliersFromApi();
    setSuppliers(freshSuppliers);
    setLoading(false);
    return freshSuppliers;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setSuppliers([]);
      setLoading(false);
      return;
    }

    fetchSuppliers().catch((error) => {
      console.error('Suppliers fetch error', error);
      setLoading(false);
    });
  }, [enabled, fetchSuppliers]);

  const createSupplier = async (payload: Omit<Supplier, 'id' | 'created_at'>) => {
    const { data, error } = await runResilientRequest(
      (signal) => supabase.from('suppliers').insert(payload).select().abortSignal(signal).single(),
      {
        label: 'supplier create',
        timeoutMessage: 'Timeout durante il salvataggio del fornitore',
      }
    );
    if (!error && data) {
      const nextSuppliers = commitSuppliersCache([...(suppliersCache ?? []), data]);
      setSuppliers(nextSuppliers);
    }
    return { data, error };
  };

  const updateSupplier = async (id: string, payload: Partial<Supplier>) => {
    const { error } = await runResilientRequest(
      (signal) => supabase.from('suppliers').update(payload).eq('id', id).abortSignal(signal),
      {
        label: 'supplier update',
        timeoutMessage: 'Timeout durante l\'aggiornamento del fornitore',
      }
    );
    if (!error) {
      const nextSuppliers = commitSuppliersCache(
        (suppliersCache ?? []).map((supplier) => (supplier.id === id ? { ...supplier, ...payload } : supplier))
      );
      setSuppliers(nextSuppliers);
    }
    return { error, data: null };
  };

  const deleteSupplier = async (id: string) => {
    const { error } = await runResilientRequest(
      (signal) => supabase.from('suppliers').delete().eq('id', id).abortSignal(signal),
      {
        label: 'supplier delete',
        timeoutMessage: 'Timeout durante l\'eliminazione del fornitore',
      }
    );
    if (!error) {
      const nextSuppliers = commitSuppliersCache((suppliersCache ?? []).filter((supplier) => supplier.id !== id));
      setSuppliers(nextSuppliers);
    }
    return { error };
  };

  return { suppliers, loading, fetchSuppliers, createSupplier, updateSupplier, deleteSupplier };
}
