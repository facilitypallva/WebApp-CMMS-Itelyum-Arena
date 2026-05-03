import { useMemo, useState } from 'react';
import { Car, CalendarClock, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useVehicleBookings } from '@/hooks/useVehicleBookings';
import { useVehicles } from '@/hooks/useVehicles';
import { cn } from '@/lib/utils';
import { AssignmentType, VehicleDeadline, VehicleStatus, VehicleWithDetails } from '@/types/vehicles';
import { VehicleDetailDialog } from '@/components/vehicles/VehicleDetailDialog';

type VehicleFilter = 'all' | 'staff' | 'giocatore' | 'sharing' | 'manutenzione';

const FILTERS: Array<{ value: VehicleFilter; label: string }> = [
  { value: 'all', label: 'Tutti' },
  { value: 'staff', label: 'Staff' },
  { value: 'giocatore', label: 'Giocatori' },
  { value: 'sharing', label: 'Sharing' },
  { value: 'manutenzione', label: 'Manutenzione' },
];

const ASSIGNMENT_CONFIG: Record<AssignmentType, { label: string; cls: string }> = {
  staff: { label: 'Staff', cls: 'border-blue-200 bg-blue-50 text-blue-700' },
  giocatore: { label: 'Giocatore', cls: 'border-purple-200 bg-purple-50 text-purple-700' },
  sharing: { label: 'Sharing', cls: 'border-teal-300 bg-teal-50 text-teal-700' },
};

const STATUS_CONFIG: Record<VehicleStatus, { label: string; cls: string }> = {
  disponibile: { label: 'Disponibile', cls: 'bg-emerald-100 text-emerald-700' },
  in_uso: { label: 'In uso', cls: 'bg-blue-100 text-blue-700' },
  manutenzione: { label: 'Manutenzione', cls: 'bg-amber-100 text-amber-700' },
  fuori_servizio: { label: 'Fuori servizio', cls: 'bg-red-100 text-red-700' },
};

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysUntil(dateKey: string) {
  const today = new Date(`${getDateKey()}T00:00:00`);
  const target = new Date(`${dateKey}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function getDeadlineTone(deadline: VehicleDeadline) {
  if (!deadline.expiry_date) return 'border-slate-200 bg-slate-50 text-slate-500';
  const days = daysUntil(deadline.expiry_date);
  if (days < 30) return 'border-red-200 bg-red-50 text-red-700';
  if (days <= 60) return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function formatDeadlineLabel(deadline: VehicleDeadline) {
  if (deadline.next_km && !deadline.expiry_date) {
    return `${deadline.deadline_type} · ${deadline.next_km.toLocaleString('it-IT')} km`;
  }

  if (!deadline.expiry_date) return `${deadline.deadline_type} · n/d`;

  const days = daysUntil(deadline.expiry_date);
  if (days < 0) return `${deadline.deadline_type} · scaduta`;
  if (days === 0) return `${deadline.deadline_type} · oggi`;
  return `${deadline.deadline_type} · ${days} gg`;
}

function getUrgentDeadlines(deadlines: VehicleDeadline[]) {
  return [...deadlines]
    .sort((a, b) => {
      if (!a.expiry_date && !b.expiry_date) return (a.next_km ?? 0) - (b.next_km ?? 0);
      if (!a.expiry_date) return 1;
      if (!b.expiry_date) return -1;
      return a.expiry_date.localeCompare(b.expiry_date);
    })
    .slice(0, 2);
}

function VehicleCard({
  vehicle,
  onOpen,
}: {
  vehicle: VehicleWithDetails;
  onOpen: () => void;
}) {
  const assignmentConfig = ASSIGNMENT_CONFIG[vehicle.assignment_type];
  const statusConfig = STATUS_CONFIG[vehicle.status];
  const urgentDeadlines = getUrgentDeadlines(vehicle.deadlines);
  const assigneeName = vehicle.assignment_type === 'sharing'
    ? 'Sharing — prenotabile'
    : vehicle.assignment?.assigned_to_name ?? 'Nessuna assegnazione';
  const assigneeRole = vehicle.assignment_type === 'sharing'
    ? 'Prenotazione da form pubblico'
    : vehicle.assignment?.assigned_to_role ?? 'Ruolo non indicato';

  return (
    <Card
      role="button"
      tabIndex={0}
      className={cn(
        'arena-card cursor-pointer border-l-4 transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-primary/30 focus-visible:outline-none',
        vehicle.assignment_type === 'sharing' ? 'border-l-teal-500' : 'border-l-transparent'
      )}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <CardContent className="flex h-full min-h-[18.5rem] flex-col p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="arena-heading truncate text-base font-bold text-slate-950">
              {vehicle.brand} {vehicle.model}
            </h3>
            <p className="mt-0.5 font-mono text-[11px] font-bold tracking-[0.12em] text-slate-500">
              {vehicle.plate}
            </p>
          </div>
          <Badge className={cn('shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]', statusConfig.cls)}>
            {statusConfig.label}
          </Badge>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <Badge className={cn('rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]', assignmentConfig.cls)}>
            {assignmentConfig.label}
          </Badge>
        </div>

        <div className="my-3 flex h-28 items-center justify-center overflow-hidden">
          {vehicle.photo_url ? (
            <img
              src={vehicle.photo_url}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="h-full w-full object-contain"
              loading="lazy"
            />
          ) : (
            <div className="flex h-16 w-24 items-center justify-center rounded-xl bg-slate-50 text-slate-300 ring-1 ring-slate-100">
              <Car size={34} strokeWidth={1.6} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2">
          <UserRound size={14} className="shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-700">{assigneeName}</p>
            <p className="truncate text-[11px] font-medium text-slate-400">{assigneeRole}</p>
          </div>
        </div>

        <div className="mt-3 border-t border-slate-100 pt-2">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <CalendarClock size={13} /> Scadenze
            </div>
            {urgentDeadlines.length === 0 ? (
              <Badge className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">
                Nessuna scadenza
              </Badge>
            ) : urgentDeadlines.slice(0, 1).map((deadline) => (
              <Badge
                key={deadline.id}
                className={cn('min-w-0 shrink truncate rounded-full border px-2.5 py-0.5 text-[10px] font-bold capitalize', getDeadlineTone(deadline))}
              >
                {formatDeadlineLabel(deadline)}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function VehiclesList() {
  const {
    vehicles,
    loading,
    updateVehicle,
    scheduleMaintenance,
    upsertDeadline,
    upsertAssignment,
  } = useVehicles();
  const { bookings } = useVehicleBookings();
  const [filter, setFilter] = useState<VehicleFilter>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const filteredVehicles = useMemo(() => vehicles.filter((vehicle) => {
    if (filter === 'all') return true;
    if (filter === 'manutenzione') return vehicle.status === 'manutenzione';
    return vehicle.assignment_type === filter;
  }), [filter, vehicles]);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
    [selectedVehicleId, vehicles]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="border-b border-slate-200">
        <div className="flex flex-wrap gap-5">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={cn(
                'border-b-2 px-1 pb-3 text-sm font-semibold transition-colors',
                filter === item.value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
              )}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {filteredVehicles.length === 0 ? (
        <div className="arena-card py-20 text-center text-slate-400">
          <Car size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium">Nessun mezzo trovato</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onOpen={() => setSelectedVehicleId(vehicle.id)}
            />
          ))}
        </div>
      )}

      <VehicleDetailDialog
        open={Boolean(selectedVehicle)}
        onOpenChange={(open) => {
          if (!open) setSelectedVehicleId(null);
        }}
        vehicle={selectedVehicle}
        vehicles={vehicles}
        bookings={bookings}
        updateVehicle={updateVehicle}
        scheduleMaintenance={scheduleMaintenance}
        upsertDeadline={upsertDeadline}
        upsertAssignment={upsertAssignment}
      />
    </div>
  );
}
