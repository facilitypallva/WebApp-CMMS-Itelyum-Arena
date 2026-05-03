import { useMemo, useState } from 'react';
import { AlertTriangle, CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useVehicleBookings } from '@/hooks/useVehicleBookings';
import { useVehicles } from '@/hooks/useVehicles';
import { cn } from '@/lib/utils';
import { DeadlineType } from '@/types/vehicles';
import { VehicleDetailDialog } from '@/components/vehicles/VehicleDetailDialog';

const DEADLINE_LABELS: Record<DeadlineType, string> = {
  assicurazione: 'Assicurazione',
  revisione: 'Revisione',
  bollo: 'Bollo',
  tagliando: 'Tagliando',
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

function getUrgencyClass(days: number) {
  if (days < 30) return 'border-[var(--arena-danger)]/25 bg-[var(--arena-danger-soft)] text-[var(--arena-danger)]';
  if (days <= 60) return 'border-[var(--arena-warning)]/25 bg-[var(--arena-warning-soft)] text-[var(--arena-warning)]';
  return 'border-[var(--arena-accent)]/25 bg-[var(--arena-accent-soft)] text-[var(--arena-accent)]';
}

function getUrgencyLabel(days: number) {
  if (days < 0) return 'Scaduta';
  if (days === 0) return 'Oggi';
  return `${days} gg`;
}

export function VehicleDeadlinesSidebar() {
  const {
    vehicles,
    updateVehicle,
    scheduleMaintenance,
    upsertDeadline,
    upsertAssignment,
  } = useVehicles();
  const { bookings } = useVehicleBookings();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const rows = useMemo(() => vehicles
    .flatMap((vehicle) => vehicle.deadlines
      .filter((deadline) => deadline.expiry_date)
      .map((deadline) => ({
        id: deadline.id,
        vehicle,
        deadline,
        days: daysUntil(deadline.expiry_date as string),
      })))
    .sort((a, b) => a.days - b.days)
    .slice(0, 8), [vehicles]);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
    [selectedVehicleId, vehicles]
  );

  return (
    <div className="overflow-hidden rounded-[var(--arena-radius-lg)] border border-[var(--arena-border-soft)] bg-[var(--arena-surface)] p-4 shadow-none">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="arena-heading text-sm font-semibold text-[var(--arena-text-primary)]">Prossime scadenze mezzi</h3>
          <p className="text-[11px] text-[var(--arena-text-muted)]">Documenti e tagliandi</p>
        </div>
        <CalendarClock size={16} className="shrink-0 text-[var(--arena-text-muted)]" />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-[var(--arena-radius-md)] border border-dashed border-[var(--arena-border-soft)] bg-[var(--arena-surface-subtle)] px-4 py-6 text-center text-sm text-[var(--arena-text-muted)]">
          Nessuna scadenza registrata
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <button
              key={row.id}
              type="button"
              className="w-full rounded-[var(--arena-radius-md)] border border-[var(--arena-border-soft)] bg-[var(--arena-surface-subtle)] px-3 py-3 text-left transition-colors duration-150 hover:border-[var(--arena-accent)]/25 hover:bg-[var(--arena-surface-elevated)]"
              onClick={() => setSelectedVehicleId(row.vehicle.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--arena-text-primary)]">
                    {row.vehicle.brand} {row.vehicle.model}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] font-semibold tracking-[0.14em] text-[var(--arena-accent)]">
                    {row.vehicle.plate}
                  </p>
                </div>
                <Badge className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', getUrgencyClass(row.days))}>
                  {getUrgencyLabel(row.days)}
                </Badge>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--arena-text-secondary)]">
                <AlertTriangle size={12} />
                {DEADLINE_LABELS[row.deadline.deadline_type]}
              </div>
            </button>
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
        initialTab="scadenze"
        updateVehicle={updateVehicle}
        scheduleMaintenance={scheduleMaintenance}
        upsertDeadline={upsertDeadline}
        upsertAssignment={upsertAssignment}
      />
    </div>
  );
}
