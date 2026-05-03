import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { emitCacheInvalidated, onCacheInvalidated } from '@/lib/cacheEvents';
import { runResilientRequest } from '@/lib/resilientRequest';
import {
  Vehicle,
  VehicleAssignment,
  VehicleDeadline,
  VehicleMaintenance,
  VehicleWithDetails,
} from '@/types/vehicles';

const VEHICLES_CACHE_TTL_MS = 60_000;

let vehiclesCache: VehicleWithDetails[] | null = null;
let vehiclesCacheAt = 0;

type VehicleApiRow = Vehicle & {
  assignments?: VehicleAssignment[] | VehicleAssignment | null;
  deadlines?: VehicleDeadline[] | VehicleDeadline | null;
  maintenances?: VehicleMaintenance[] | VehicleMaintenance | null;
};

type CreateVehicleData = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>;
type UpdateVehicleData = Partial<Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>>;
type ScheduleMaintenanceData = Pick<VehicleMaintenance, 'maintenance_type' | 'start_date' | 'end_date' | 'notes'>;

function asArray<T>(value: T[] | T | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}

function notifyError(error: unknown, fallback: string) {
  const message = getErrorMessage(error, fallback);
  console.error(message, error);
  toast.error(message);
  return message;
}

function normalizeVehicle(row: VehicleApiRow): VehicleWithDetails {
  const assignments = asArray(row.assignments);
  const assignment = assignments.find((item) => item.active) ?? assignments[0];

  return {
    ...row,
    assignment,
    deadlines: asArray(row.deadlines),
    maintenances: asArray(row.maintenances),
  };
}

function sortVehicles(items: VehicleWithDetails[]) {
  return [...items].sort((a, b) => {
    const labelA = `${a.brand} ${a.model} ${a.plate}`;
    const labelB = `${b.brand} ${b.model} ${b.plate}`;
    return labelA.localeCompare(labelB, 'it');
  });
}

function commitVehiclesCache(nextVehicles: VehicleWithDetails[]) {
  const committed = sortVehicles(nextVehicles);
  vehiclesCache = committed;
  vehiclesCacheAt = Date.now();
  return committed;
}

function invalidateVehiclesCache() {
  vehiclesCache = null;
  vehiclesCacheAt = 0;
}

async function loadVehiclesFromApi() {
  const { data, error } = await runResilientRequest(
    (signal) => supabase
      .from('vehicles')
      .select('*, assignments:vehicle_assignments!vehicle_assignments_vehicle_id_fkey(*), deadlines:vehicle_deadlines(*), maintenances:vehicle_maintenances(*)')
      .order('brand')
      .abortSignal(signal),
    {
      label: 'vehicles fetch',
      timeoutMessage: 'Timeout durante il caricamento dei mezzi',
    }
  );

  if (error) {
    throw error;
  }

  return commitVehiclesCache(((data ?? []) as VehicleApiRow[]).map(normalizeVehicle));
}

function stripGeneratedFields<T extends { id: string; created_at: string | null }>(payload: T) {
  const { id, created_at, ...insertPayload } = payload;
  return insertPayload;
}

export function useVehicles() {
  const [vehicles, setVehicles] = useState<VehicleWithDetails[]>(vehiclesCache ?? []);
  const [loading, setLoading] = useState(!vehiclesCache);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => onCacheInvalidated('vehicles', () => {
    invalidateVehiclesCache();
    setTick((current) => current + 1);
  }), []);

  const refreshAfterMutation = useCallback(async () => {
    invalidateVehiclesCache();
    const freshVehicles = await loadVehiclesFromApi();
    setVehicles(freshVehicles);
    setError(null);
  }, []);

  useEffect(() => {
    const hasFreshCache = vehiclesCache && Date.now() - vehiclesCacheAt < VEHICLES_CACHE_TTL_MS;

    if (vehiclesCache) {
      setVehicles(vehiclesCache);
      setLoading(false);
      if (hasFreshCache) return;
    } else {
      setLoading(true);
      setError(null);
    }

    loadVehiclesFromApi()
      .then((freshVehicles) => {
        setVehicles(freshVehicles);
        setError(null);
      })
      .catch((err) => {
        setError(notifyError(err, 'Impossibile caricare i mezzi. Controlla la connessione e riprova.'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tick]);

  const refetch = useCallback(() => {
    invalidateVehiclesCache();
    setTick((current) => current + 1);
  }, []);

  const createVehicle = useCallback(async (data: CreateVehicleData): Promise<void> => {
    try {
      const { error: createError } = await runResilientRequest(
        (signal) => supabase.from('vehicles').insert(data).abortSignal(signal),
        {
          label: 'vehicle create',
          timeoutMessage: 'Timeout durante il salvataggio del mezzo',
        }
      );

      if (createError) throw createError;
      await refreshAfterMutation();
      emitCacheInvalidated('vehicles');
    } catch (err) {
      setError(notifyError(err, 'Errore nel salvataggio del mezzo'));
      throw err;
    }
  }, [refreshAfterMutation]);

  const updateVehicle = useCallback(async (id: string, data: UpdateVehicleData): Promise<void> => {
    try {
      const { error: updateError } = await runResilientRequest(
        (signal) => supabase.from('vehicles').update(data).eq('id', id).abortSignal(signal),
        {
          label: 'vehicle update',
          timeoutMessage: 'Timeout durante l\'aggiornamento del mezzo',
        }
      );

      if (updateError) throw updateError;
      await refreshAfterMutation();
      emitCacheInvalidated('vehicles');
    } catch (err) {
      setError(notifyError(err, 'Errore nell\'aggiornamento del mezzo'));
      throw err;
    }
  }, [refreshAfterMutation]);

  const deleteVehicle = useCallback(async (id: string): Promise<void> => {
    try {
      const { error: deleteError } = await runResilientRequest(
        (signal) => supabase.from('vehicles').delete().eq('id', id).abortSignal(signal),
        {
          label: 'vehicle delete',
          timeoutMessage: 'Timeout durante l\'eliminazione del mezzo',
        }
      );

      if (deleteError) throw deleteError;
      await refreshAfterMutation();
      emitCacheInvalidated('vehicles');
    } catch (err) {
      setError(notifyError(err, 'Errore durante l\'eliminazione del mezzo'));
      throw err;
    }
  }, [refreshAfterMutation]);

  const scheduleMaintenance = useCallback(async (
    vehicleId: string,
    data: ScheduleMaintenanceData
  ): Promise<void> => {
    try {
      const { error: maintenanceError } = await runResilientRequest(
        (signal) => Promise.all([
          supabase
            .from('vehicle_maintenances')
            .insert({ ...data, vehicle_id: vehicleId })
            .abortSignal(signal),
          supabase
            .from('vehicles')
            .update({ status: 'manutenzione' })
            .eq('id', vehicleId)
            .abortSignal(signal),
        ]),
        {
          label: 'vehicle maintenance schedule',
          timeoutMessage: 'Timeout durante la pianificazione della manutenzione',
        }
      ).then((responses) => {
        const failed = responses.find((response) => response.error);
        return { error: failed?.error ?? null };
      });

      if (maintenanceError) throw maintenanceError;
      await refreshAfterMutation();
      emitCacheInvalidated('vehicles');
    } catch (err) {
      setError(notifyError(err, 'Errore nella pianificazione della manutenzione'));
      throw err;
    }
  }, [refreshAfterMutation]);

  const upsertDeadline = useCallback(async (vehicleId: string, data: VehicleDeadline): Promise<void> => {
    try {
      const payload = { ...data, vehicle_id: vehicleId };
      const request = data.id
        ? (signal: AbortSignal) => supabase.from('vehicle_deadlines').upsert(payload).abortSignal(signal)
        : (signal: AbortSignal) => supabase.from('vehicle_deadlines').insert(stripGeneratedFields(payload)).abortSignal(signal);

      const { error: deadlineError } = await runResilientRequest(
        request,
        {
          label: 'vehicle deadline upsert',
          timeoutMessage: 'Timeout durante il salvataggio della scadenza',
        }
      );

      if (deadlineError) throw deadlineError;
      await refreshAfterMutation();
      emitCacheInvalidated('vehicles');
    } catch (err) {
      setError(notifyError(err, 'Errore nel salvataggio della scadenza'));
      throw err;
    }
  }, [refreshAfterMutation]);

  const upsertAssignment = useCallback(async (vehicleId: string, data: VehicleAssignment): Promise<void> => {
    try {
      const payload = { ...data, vehicle_id: vehicleId };
      const request = data.id
        ? (signal: AbortSignal) => supabase.from('vehicle_assignments').upsert(payload).abortSignal(signal)
        : (signal: AbortSignal) => supabase.from('vehicle_assignments').insert(stripGeneratedFields(payload)).abortSignal(signal);

      const { error: assignmentError } = await runResilientRequest(
        request,
        {
          label: 'vehicle assignment upsert',
          timeoutMessage: 'Timeout durante il salvataggio dell\'assegnazione',
        }
      );

      if (assignmentError) throw assignmentError;
      await refreshAfterMutation();
      emitCacheInvalidated('vehicles');
    } catch (err) {
      setError(notifyError(err, 'Errore nel salvataggio dell\'assegnazione'));
      throw err;
    }
  }, [refreshAfterMutation]);

  return {
    vehicles,
    loading,
    error,
    refetch,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    scheduleMaintenance,
    upsertDeadline,
    upsertAssignment,
  };
}
