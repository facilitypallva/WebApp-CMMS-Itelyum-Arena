import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { VehicleBooking, VehicleWithDetails } from '@/types/vehicles';

type VehicleWeekCalendarProps = {
  vehicles: VehicleWithDetails[];
  bookings: VehicleBooking[];
};

type SlotState = {
  label: string;
  tooltip: string;
  className: string;
};

const LEGEND = [
  { label: 'In uso', className: 'bg-slate-900' },
  { label: 'Manutenzione', className: 'bg-amber-400' },
  { label: 'Sharing richiesto', className: 'bg-teal-500' },
  { label: 'Disponibile', className: 'bg-slate-100' },
];

function getMonday(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatWeekRange(days: Date[]) {
  const first = days[0];
  const last = days[days.length - 1];
  const formatter = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short' });
  return `${formatter.format(first)} - ${formatter.format(last)}`;
}

function getVehicleSlotState(
  vehicle: VehicleWithDetails,
  bookings: VehicleBooking[],
  dateKey: string
): SlotState {
  const maintenance = vehicle.maintenances.find((item) => item.start_date <= dateKey && item.end_date >= dateKey);
  if (maintenance) {
    return {
      label: 'Manutenzione',
      tooltip: maintenance.maintenance_type,
      className: 'border-amber-200 bg-amber-400 text-amber-950',
    };
  }

  const approvedBooking = bookings.find((booking) => (
    booking.vehicle_id === vehicle.id && booking.status === 'approved' && booking.trip_date === dateKey
  ));
  if (approvedBooking) {
    return {
      label: 'In uso',
      tooltip: `${approvedBooking.requester_name} ${approvedBooking.requester_surname}`,
      className: 'border-slate-900 bg-slate-900 text-white',
    };
  }

  const hasPendingSharingRequest = vehicle.assignment_type === 'sharing' && bookings.some((booking) => (
    booking.status === 'pending' && booking.trip_date === dateKey
  ));
  if (hasPendingSharingRequest) {
    return {
      label: 'Sharing',
      tooltip: 'Richiesta sharing in attesa',
      className: 'border-teal-200 bg-teal-500 text-white',
    };
  }

  return {
    label: 'Libero',
    tooltip: 'Disponibile',
    className: 'border-slate-200 bg-slate-100 text-slate-500',
  };
}

export function VehicleWeekCalendar({ vehicles, bookings }: VehicleWeekCalendarProps) {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart]
  );

  const visibleVehicles = useMemo(() => vehicles.slice(0, 15), [vehicles]);

  return (
    <section className="arena-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="arena-heading text-base font-semibold text-slate-950">Calendario settimanale mezzi</h3>
          <p className="text-xs font-medium text-slate-500">{formatWeekRange(weekDays)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Settimana precedente"
            onClick={() => setWeekStart((current) => addDays(current, -7))}
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Settimana successiva"
            onClick={() => setWeekStart((current) => addDays(current, 7))}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[180px_repeat(7,minmax(72px,1fr))] border-b border-slate-100 bg-slate-50">
            <div className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">Veicolo</div>
            {weekDays.map((day) => (
              <div key={getDateKey(day)} className="px-2 py-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  {new Intl.DateTimeFormat('it-IT', { weekday: 'short' }).format(day)}
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">{day.getDate()}</p>
              </div>
            ))}
          </div>

          {visibleVehicles.length === 0 ? (
            <div className="p-8 text-center text-sm font-medium text-slate-400">Nessun mezzo da mostrare</div>
          ) : visibleVehicles.map((vehicle) => (
            <div key={vehicle.id} className="grid grid-cols-[180px_repeat(7,minmax(72px,1fr))] border-b border-slate-100 last:border-b-0">
              <div className="min-w-0 px-4 py-3">
                <p className="truncate text-sm font-bold text-slate-900">{vehicle.brand} {vehicle.model}</p>
                <p className="mt-0.5 font-mono text-[10px] font-bold tracking-[0.14em] text-primary">{vehicle.plate}</p>
              </div>
              {weekDays.map((day) => {
                const dateKey = getDateKey(day);
                const slot = getVehicleSlotState(vehicle, bookings, dateKey);

                return (
                  <div key={`${vehicle.id}-${dateKey}`} className="flex items-center justify-center px-2 py-3">
                    <div className="group relative">
                      <div
                        className={cn(
                          'flex h-10 w-full min-w-16 items-center justify-center rounded-lg border text-[10px] font-bold',
                          slot.className
                        )}
                      >
                        {slot.label}
                      </div>
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max max-w-48 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg group-hover:block">
                        {slot.tooltip}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-slate-100 px-4 py-3">
        {LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className={cn('h-2.5 w-2.5 rounded-full', item.className)} />
            {item.label}
          </div>
        ))}
      </div>
    </section>
  );
}
