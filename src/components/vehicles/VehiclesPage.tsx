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
    { label: 'Veicoli disponibili oggi', value: availableToday, icon: Car, color: 'bg-emerald-500' },
    { label: 'Prenotazioni attive oggi', value: activeBookingsToday, icon: CalendarCheck2, color: 'bg-blue-500' },
    { label: 'Scadenze entro 30 giorni', value: deadlinesWithinThirtyDays, icon: AlertTriangle, color: 'bg-orange-500' },
    { label: 'Richieste sharing in attesa', value: pendingCount, icon: Clock, color: 'bg-red-500', urgent: pendingCount > 0 },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-full max-w-400 flex-col gap-5">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="arena-card flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="arena-heading text-xl font-semibold text-slate-950">
            Gestione Mezzi
          </h2>
          <Badge className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {vehicles.length.toLocaleString('it-IT')} veicoli
          </Badge>
          {error && (
            <span className="text-sm font-medium text-red-600">{error}</span>
          )}
        </div>

        {canManageVehicles && (
          <Button
            type="button"
            className="h-9 gap-2 rounded-lg bg-blue-800 px-4 text-sm font-semibold text-white hover:bg-blue-900"
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
            <Card className="arena-card overflow-hidden py-0 transition-all duration-300 hover:shadow-md">
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-0.5">
                  <p className="arena-kicker">{kpi.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="arena-heading text-2xl font-bold text-slate-950">
                      {kpi.value.toLocaleString('it-IT')}
                    </p>
                    {kpi.urgent && (
                      <Badge className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-red-600">
                        Da gestire
                      </Badge>
                    )}
                  </div>
                </div>
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white', kpi.color)}>
                  <kpi.icon size={18} />
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
