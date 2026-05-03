import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, CalendarCheck2, Car, Clock, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useVehicleBookings } from '@/hooks/useVehicleBookings';
import { useVehicles } from '@/hooks/useVehicles';
import { cn } from '@/lib/utils';
import { VehicleBookingsSidebar } from '@/components/vehicles/VehicleBookingsSidebar';
import { VehicleCreateDialog } from '@/components/vehicles/VehicleCreateDialog';
import { VehicleDeadlinesSidebar } from '@/components/vehicles/VehicleDeadlinesSidebar';
import { VehicleWeekCalendar } from '@/components/vehicles/VehicleWeekCalendar';
import { VehiclesList } from '@/components/vehicles/VehiclesList';

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function VehiclesPage() {
  const { role } = useAuth();
  const { vehicles, loading: vehiclesLoading, error, createVehicle } = useVehicles();
  const { bookings, pendingCount, loading: bookingsLoading } = useVehicleBookings();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const canManageVehicles = role === 'ADMIN' || role === 'RESPONSABILE';
  const todayKey = getLocalDateKey();
  const thirtyDaysFromTodayKey = getLocalDateKey(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const loading = vehiclesLoading || bookingsLoading;

  const availableToday = useMemo(
    () => vehicles.filter((vehicle) => vehicle.status === 'disponibile').length,
    [vehicles]
  );

  const activeBookingsToday = useMemo(
    () => bookings.filter((booking) => booking.status === 'approved' && booking.trip_date === todayKey).length,
    [bookings, todayKey]
  );

  const deadlinesWithinThirtyDays = useMemo(
    () => vehicles.reduce((count, vehicle) => (
      count + vehicle.deadlines.filter((deadline) => (
        Boolean(deadline.expiry_date) && deadline.expiry_date! <= thirtyDaysFromTodayKey
      )).length
    ), 0),
    [thirtyDaysFromTodayKey, vehicles]
  );

  const kpis = [
    { label: 'Veicoli disponibili oggi', value: availableToday, icon: Car, color: 'bg-[var(--arena-accent-soft)] text-[var(--arena-accent)]' },
    { label: 'Prenotazioni attive oggi', value: activeBookingsToday, icon: CalendarCheck2, color: 'bg-[var(--arena-info-soft)] text-[var(--arena-info)]' },
    { label: 'Scadenze entro 30 giorni', value: deadlinesWithinThirtyDays, icon: AlertTriangle, color: 'bg-[var(--arena-warning-soft)] text-[var(--arena-warning)]' },
    { label: 'Richieste sharing in attesa', value: pendingCount, icon: Clock, color: 'bg-[var(--arena-danger-soft)] text-[var(--arena-danger)]', urgent: pendingCount > 0 },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--arena-border)] border-t-[var(--arena-accent)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-full max-w-400 flex-col gap-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 rounded-[var(--arena-radius-lg)] border border-[var(--arena-border-soft)] bg-[var(--arena-surface)] px-5 py-4 shadow-none sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="arena-heading text-xl font-semibold text-[var(--arena-text-primary)]">
            Gestione Mezzi
          </h2>
          <Badge className="rounded-full border border-[var(--arena-border-soft)] bg-[var(--arena-info-soft)] px-3 py-1 text-xs font-semibold text-[var(--arena-info)]">
            {vehicles.length.toLocaleString('it-IT')} veicoli
          </Badge>
          {error && (
            <span className="text-sm font-medium text-[var(--arena-danger)]">{error}</span>
          )}
        </div>

        {canManageVehicles && (
          <Button
            type="button"
            className="h-9 gap-2 rounded-[var(--arena-radius-sm)] bg-[var(--arena-accent)]/90 px-4 text-sm font-semibold text-[#07110c] hover:bg-[var(--arena-accent)]"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus size={16} /> Aggiungi Veicolo
          </Button>
        )}
      </motion.div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
          >
            <Card className="overflow-hidden rounded-[var(--arena-radius-lg)] border border-[var(--arena-border-soft)] bg-[var(--arena-surface)] py-0 shadow-none transition-colors duration-150 hover:bg-[var(--arena-surface-elevated)]">
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--arena-text-muted)]">{kpi.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="arena-heading text-[26px] font-semibold leading-tight text-[var(--arena-text-primary)]">
                      {kpi.value.toLocaleString('it-IT')}
                    </p>
                    {kpi.urgent && (
                      <Badge className="rounded-full bg-[var(--arena-danger-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--arena-danger)] hover:bg-[var(--arena-danger-soft)]">
                        Da gestire
                      </Badge>
                    )}
                  </div>
                </div>
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--arena-radius-sm)]', kpi.color)}>
                  <kpi.icon size={16} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <VehiclesList />
          <VehicleWeekCalendar vehicles={vehicles} bookings={bookings} />
        </div>

        <aside className="flex w-full flex-col gap-5 xl:sticky xl:top-6 xl:mt-14 xl:w-72">
          <VehicleDeadlinesSidebar />
          <VehicleBookingsSidebar />
        </aside>
      </div>

      <VehicleCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        createVehicle={createVehicle}
      />
    </div>
  );
}

export default VehiclesPage;
