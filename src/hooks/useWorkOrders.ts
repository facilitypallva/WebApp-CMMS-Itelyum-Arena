import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { WorkOrder } from '@/types';
import { logAudit } from '@/lib/auditLog';
import { useAuth } from '@/contexts/AuthContext';
import { invalidateAssetsCache } from '@/hooks/useAssets';
import { invalidateDashboardCache } from '@/hooks/useDashboard';
import { runResilientRequest } from '@/lib/resilientRequest';

const WORK_ORDERS_CACHE_TTL_MS = 60_000;

let workOrdersCache: WorkOrder[] | null = null;
let workOrdersCacheAt = 0;

function sortWorkOrders(items: WorkOrder[]) {
  return [...items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function commitWorkOrdersCache(nextWorkOrders: WorkOrder[]) {
  const committed = sortWorkOrders(nextWorkOrders);
  workOrdersCache = committed;
  workOrdersCacheAt = Date.now();
  return committed;
}

async function loadWorkOrdersFromApi() {
  const { data, error } = await runResilientRequest(
    (signal) => supabase
      .from('work_orders')
      .select('*, asset:assets(name, category), technician:technicians(name, employment_type, supplier_id, supplier:suppliers(name)), supplier:suppliers(name)')
      .order('created_at', { ascending: false })
      .abortSignal(signal),
    {
      label: 'work orders fetch',
      timeoutMessage: 'Timeout durante il caricamento dei work order',
    }
  );

  if (error) {
    throw error;
  }

  return commitWorkOrdersCache((data ?? []) as WorkOrder[]);
}

export function useWorkOrders(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(enabled && !workOrdersCache);

  const fetchWorkOrders = useCallback(async (force = false) => {
    if (!enabled) {
      setLoading(false);
      return [];
    }

    const hasFreshCache = workOrdersCache && Date.now() - workOrdersCacheAt < WORK_ORDERS_CACHE_TTL_MS;

    if (!force && workOrdersCache) {
      setWorkOrders(workOrdersCache);
      setLoading(false);
      if (hasFreshCache) return workOrdersCache;
    } else {
      setLoading(true);
    }

    const freshWorkOrders = await loadWorkOrdersFromApi();
    setWorkOrders(freshWorkOrders);
    setLoading(false);
    return freshWorkOrders;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setWorkOrders([]);
      setLoading(false);
      return;
    }

    fetchWorkOrders().catch(console.error);
  }, [enabled, fetchWorkOrders]);

  const createWorkOrder = async (payload: Omit<WorkOrder, 'id' | 'created_at' | 'code' | 'asset' | 'technician' | 'supplier'>) => {
    const { data, error } = await runResilientRequest(
      (signal) => supabase
        .from('work_orders')
        .insert(payload)
        .select('*, asset:assets(name, category), technician:technicians(name, employment_type, supplier_id, supplier:suppliers(name)), supplier:suppliers(name)')
        .abortSignal(signal)
        .single(),
      {
        label: 'work order create',
        timeoutMessage: 'Timeout durante il salvataggio del work order',
      }
    );
    if (!error && data && user) {
      const nextWorkOrders = commitWorkOrdersCache([...(workOrdersCache ?? []), data as WorkOrder]);
      setWorkOrders(nextWorkOrders);
      await logAudit(user.id, 'CREATE', 'work_orders', data.id, null, data);
      invalidateAssetsCache();
      invalidateDashboardCache();
    }
    return { error, data };
  };

  const updateWorkOrder = async (id: string, payload: Partial<WorkOrder>) => {
    const old = workOrders.find((w) => w.id === id);
    const { error } = await runResilientRequest(
      (signal) => supabase
        .from('work_orders')
        .update(payload)
        .eq('id', id)
        .abortSignal(signal),
      {
        label: 'work order update',
        timeoutMessage: 'Timeout durante l\'aggiornamento del work order',
      }
    );
    if (!error && user) {
      const nextWorkOrders = commitWorkOrdersCache(
        (workOrdersCache ?? []).map((workOrder) => (workOrder.id === id ? { ...workOrder, ...payload } : workOrder))
      );
      setWorkOrders(nextWorkOrders);
      await logAudit(user.id, 'UPDATE', 'work_orders', id, old ?? null, payload);
      invalidateAssetsCache();
      invalidateDashboardCache();
    }
    return { error };
  };

  const deleteWorkOrder = async (id: string) => {
    const old = workOrders.find((w) => w.id === id);
    const previousWorkOrders = workOrdersCache ?? workOrders;
    const nextWorkOrders = commitWorkOrdersCache(previousWorkOrders.filter((workOrder) => workOrder.id !== id));
    setWorkOrders(nextWorkOrders);
    const { error } = await runResilientRequest(
      (signal) => supabase.from('work_orders').delete().eq('id', id).abortSignal(signal),
      {
        label: 'work order delete',
        timeoutMessage: 'Timeout durante l\'eliminazione del work order',
      }
    );
    if (error) {
      const restoredWorkOrders = commitWorkOrdersCache(previousWorkOrders);
      setWorkOrders(restoredWorkOrders);
      return { error };
    }
    if (user) {
      await logAudit(user.id, 'DELETE', 'work_orders', id, old ?? null, null);
      invalidateAssetsCache();
      invalidateDashboardCache();
    }
    return { error };
  };

  return { workOrders, loading, fetchWorkOrders, createWorkOrder, updateWorkOrder, deleteWorkOrder };
}
