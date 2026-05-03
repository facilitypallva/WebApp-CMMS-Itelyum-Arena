import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { runResilientRequest } from '@/lib/resilientRequest';
import { VehicleBooking } from '@/types/vehicles';

const VEHICLE_BOOKINGS_CACHE_TTL_MS = 60_000;

let vehicleBookingsCache: VehicleBooking[] | null = null;
let vehicleBookingsCacheAt = 0;

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
}

function sortBookings(items: VehicleBooking[]) {
  return [...items].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
}

function commitVehicleBookingsCache(nextBookings: VehicleBooking[]) {
  const committed = sortBookings(nextBookings);
  vehicleBookingsCache = committed;
  vehicleBookingsCacheAt = Date.now();
  return committed;
}

function invalidateVehicleBookingsCache() {
  vehicleBookingsCache = null;
  vehicleBookingsCacheAt = 0;
}

async function loadVehicleBookingsFromApi() {
  const { data, error } = await runResilientRequest(
    (signal) => supabase
      .from('vehicle_bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .abortSignal(signal),
    {
      label: 'vehicle bookings fetch',
      timeoutMessage: 'Timeout durante il caricamento delle prenotazioni mezzi',
    }
  );

  if (error) {
    throw error;
  }

  return commitVehicleBookingsCache((data ?? []) as VehicleBooking[]);
}

export function useVehicleBookings() {
  const [bookings, setBookings] = useState<VehicleBooking[]>(vehicleBookingsCache ?? []);
  const [loading, setLoading] = useState(!vehicleBookingsCache);
  const [tick, setTick] = useState(0);

  const pendingCount = useMemo(
    () => bookings.filter((booking) => booking.status === 'pending').length,
    [bookings]
  );

  const refreshAfterMutation = useCallback(async () => {
    invalidateVehicleBookingsCache();
    const freshBookings = await loadVehicleBookingsFromApi();
    setBookings(freshBookings);
  }, []);

  useEffect(() => {
    const hasFreshCache = vehicleBookingsCache
      && Date.now() - vehicleBookingsCacheAt < VEHICLE_BOOKINGS_CACHE_TTL_MS;

    if (vehicleBookingsCache) {
      setBookings(vehicleBookingsCache);
      setLoading(false);
      if (hasFreshCache) return;
    } else {
      setLoading(true);
    }

    loadVehicleBookingsFromApi()
      .then(setBookings)
      .catch((err) => {
        notifyError(err, 'Impossibile caricare le prenotazioni mezzi. Controlla la connessione e riprova.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tick]);

  const refetch = useCallback(() => {
    invalidateVehicleBookingsCache();
    setTick((current) => current + 1);
  }, []);

  const approveBooking = useCallback(async (id: string, vehicleId: string): Promise<void> => {
    try {
      const { error } = await runResilientRequest(
        (signal) => supabase
          .from('vehicle_bookings')
          .update({ status: 'approved', vehicle_id: vehicleId })
          .eq('id', id)
          .abortSignal(signal),
        {
          label: 'vehicle booking approve',
          timeoutMessage: 'Timeout durante l\'approvazione della prenotazione',
        }
      );

      if (error) throw error;
      await refreshAfterMutation();
    } catch (err) {
      notifyError(err, 'Errore durante l\'approvazione della prenotazione');
      throw err;
    }
  }, [refreshAfterMutation]);

  const rejectBooking = useCallback(async (id: string, notes?: string): Promise<void> => {
    try {
      const payload: Partial<VehicleBooking> = { status: 'rejected' };
      if (notes !== undefined) payload.fm_notes = notes;

      const { error } = await runResilientRequest(
        (signal) => supabase
          .from('vehicle_bookings')
          .update(payload)
          .eq('id', id)
          .abortSignal(signal),
        {
          label: 'vehicle booking reject',
          timeoutMessage: 'Timeout durante il rifiuto della prenotazione',
        }
      );

      if (error) throw error;
      await refreshAfterMutation();
    } catch (err) {
      notifyError(err, 'Errore durante il rifiuto della prenotazione');
      throw err;
    }
  }, [refreshAfterMutation]);

  return {
    bookings,
    pendingCount,
    loading,
    approveBooking,
    rejectBooking,
    refetch,
  };
}
