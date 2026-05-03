import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ClipboardList, Copy, ExternalLink, Route, Save, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useVehicleBookings } from '@/hooks/useVehicleBookings';
import { useVehicles } from '@/hooks/useVehicles';
import { VehicleBooking, VehicleWithDetails } from '@/types/vehicles';

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short' }).format(date);
}

function formatTime(value: string | null | undefined) {
  return value ? value.slice(0, 5) : '';
}

function isVehicleAvailableForDate(vehicle: VehicleWithDetails, dateKey: string, bookings: VehicleBooking[]) {
  if (vehicle.assignment_type !== 'sharing') return false;
  if (vehicle.status === 'manutenzione' || vehicle.status === 'fuori_servizio') return false;

  const hasMaintenance = vehicle.maintenances.some((maintenance) => (
    maintenance.start_date <= dateKey && maintenance.end_date >= dateKey
  ));
  const hasApprovedBooking = bookings.some((booking) => (
    booking.vehicle_id === vehicle.id && booking.status === 'approved' && booking.trip_date === dateKey
  ));

  return !hasMaintenance && !hasApprovedBooking;
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function VehicleBookingsSidebar() {
  const { role } = useAuth();
  const canManage = role === 'ADMIN' || role === 'RESPONSABILE';
  const { vehicles, updateVehicle } = useVehicles();
  const { bookings, approveBooking, rejectBooking, refetch } = useVehicleBookings();
  const [selectedVehicleByBooking, setSelectedVehicleByBooking] = useState<Record<string, string>>({});
  const [busyBookingId, setBusyBookingId] = useState<string | null>(null);
  const [selectedLinkVehicleId, setSelectedLinkVehicleId] = useState('');
  const [linkSlugDraft, setLinkSlugDraft] = useState('');
  const [savingLink, setSavingLink] = useState(false);

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'pending').sort((a, b) => a.trip_date.localeCompare(b.trip_date)),
    [bookings]
  );

  const sharingVehicles = useMemo(
    () => vehicles.filter((vehicle) => vehicle.assignment_type === 'sharing'),
    [vehicles]
  );

  const configuredSharingVehicle = useMemo(
    () => sharingVehicles.find((vehicle) => vehicle.sharing_link_slug) ?? sharingVehicles[0] ?? null,
    [sharingVehicles]
  );

  const selectedLinkVehicle = useMemo(
    () => sharingVehicles.find((vehicle) => vehicle.id === selectedLinkVehicleId) ?? configuredSharingVehicle,
    [configuredSharingVehicle, selectedLinkVehicleId, sharingVehicles]
  );

  const publicLink = selectedLinkVehicle?.sharing_link_slug
    ? `${window.location.origin}/booking/${selectedLinkVehicle.sharing_link_slug}`
    : null;

  useEffect(() => {
    if (!configuredSharingVehicle) {
      setSelectedLinkVehicleId('');
      setLinkSlugDraft('');
      return;
    }

    setSelectedLinkVehicleId(configuredSharingVehicle.id);
    setLinkSlugDraft(configuredSharingVehicle.sharing_link_slug ?? '');
  }, [configuredSharingVehicle]);

  const handleApprove = async (bookingId: string, vehicleId: string | undefined) => {
    if (!vehicleId) {
      toast.error('Seleziona un veicolo sharing');
      return;
    }

    setBusyBookingId(bookingId);
    try {
      await approveBooking(bookingId, vehicleId);
      toast.success('Prenotazione approvata');
      refetch();
    } finally {
      setBusyBookingId(null);
    }
  };

  const handleReject = async (bookingId: string) => {
    setBusyBookingId(bookingId);
    try {
      await rejectBooking(bookingId);
      toast.success('Richiesta rifiutata');
      refetch();
    } finally {
      setBusyBookingId(null);
    }
  };

  const copyLink = async () => {
    if (!publicLink) {
      toast.error('Link prenotazione non configurato');
      return;
    }

    try {
      await navigator.clipboard.writeText(publicLink);
      toast.success('Link copiato');
    } catch {
      toast.error('Impossibile copiare il link');
    }
  };

  const handleSaveLink = async () => {
    if (!selectedLinkVehicle) {
      toast.error('Crea prima un veicolo di tipo Sharing');
      return;
    }

    const normalizedSlug = normalizeSlug(linkSlugDraft || selectedLinkVehicle.plate);
    if (!normalizedSlug) {
      toast.error('Inserisci uno slug valido');
      return;
    }

    setSavingLink(true);
    try {
      await updateVehicle(selectedLinkVehicle.id, { sharing_link_slug: normalizedSlug });
      setLinkSlugDraft(normalizedSlug);
      toast.success('Link prenotazione configurato');
    } finally {
      setSavingLink(false);
    }
  };

  const openPublicLink = () => {
    if (!publicLink) {
      toast.error('Link prenotazione non configurato');
      return;
    }
    window.open(publicLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="overflow-hidden rounded-[var(--arena-radius-lg)] border border-[var(--arena-border-soft)] bg-[var(--arena-surface)] p-4 shadow-none">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="arena-heading text-sm font-semibold text-[var(--arena-text-primary)]">Richieste sharing</h3>
          <p className="text-[11px] text-[var(--arena-text-muted)]">{pendingBookings.length} in attesa</p>
        </div>
        <ClipboardList size={16} className="shrink-0 text-[var(--arena-text-muted)]" />
      </div>

      {pendingBookings.length === 0 ? (
        <div className="rounded-[var(--arena-radius-md)] border border-dashed border-[var(--arena-border-soft)] bg-[var(--arena-surface-subtle)] px-4 py-6 text-center text-sm text-[var(--arena-text-muted)]">
          <XCircle size={28} className="mx-auto mb-2 opacity-40" />
          Nessuna richiesta in attesa
        </div>
      ) : (
        <div className="space-y-3">
          {pendingBookings.map((booking) => {
            const availableVehicles = vehicles.filter((vehicle) => isVehicleAvailableForDate(vehicle, booking.trip_date, bookings));
            const selectedVehicleId = selectedVehicleByBooking[booking.id];

            return (
              <div key={booking.id} className="rounded-[var(--arena-radius-md)] border border-[var(--arena-border-soft)] bg-[var(--arena-surface-subtle)] p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--arena-text-primary)]">
                      {booking.requester_name} {booking.requester_surname}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-[var(--arena-text-secondary)]">
                      <CalendarDays size={12} />
                      {formatDate(booking.trip_date)} · {formatTime(booking.departure_time)}
                    </p>
                  </div>
                  <Badge className="rounded-full bg-[var(--arena-warning-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--arena-warning)]">
                    Pending
                  </Badge>
                </div>

                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[var(--arena-text-secondary)]">
                  <Route size={12} />
                  {booking.departure} → {booking.destination}
                </p>
                <p className="mt-2 line-clamp-3 text-xs text-[var(--arena-text-muted)]">{booking.reason}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Popover>
                    <PopoverTrigger render={<Button variant="outline" size="sm" className="arena-dark-outline-button rounded-lg" disabled={busyBookingId === booking.id} />}>
                      Assegna veicolo
                    </PopoverTrigger>
                    <PopoverContent align="start" className="arena-dark-popover w-72 p-3">
                      <div className="space-y-3">
                        <div>
                        <p className="text-sm font-semibold text-[var(--arena-text-primary)]">Veicolo sharing</p>
                          <p className="text-xs text-[var(--arena-text-muted)]">Disponibili il {formatDate(booking.trip_date)}</p>
                        </div>
                        <Select
                          value={selectedVehicleId ?? ''}
                          onValueChange={(value) => setSelectedVehicleByBooking((current) => ({ ...current, [booking.id]: value }))}
                          disabled={availableVehicles.length === 0}
                        >
                          <SelectTrigger className="arena-dark-control h-9 w-full">
                            <SelectValue placeholder={availableVehicles.length === 0 ? 'Nessun mezzo disponibile' : 'Seleziona mezzo'} />
                          </SelectTrigger>
                          <SelectContent className="arena-dark-select-content">
                            {availableVehicles.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.id}>
                                {vehicle.brand} {vehicle.model} · {vehicle.plate}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          className="w-full rounded-[var(--arena-radius-sm)] bg-[var(--arena-accent)] text-[#07110c] hover:bg-[var(--arena-accent)]"
                          disabled={!selectedVehicleId || busyBookingId === booking.id}
                          onClick={() => handleApprove(booking.id, selectedVehicleId)}
                        >
                          Approva
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-[var(--arena-radius-sm)] border-[var(--arena-danger)]/25 bg-[var(--arena-surface-subtle)] text-[var(--arena-danger)] hover:bg-[var(--arena-danger-soft)] hover:text-[var(--arena-danger)]"
                    disabled={busyBookingId === booking.id}
                    onClick={() => handleReject(booking.id)}
                  >
                    Rifiuta
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 border-t border-[var(--arena-border-soft)] pt-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--arena-text-muted)]">Link prenotazione</p>
        {sharingVehicles.length === 0 ? (
          <div className="rounded-[var(--arena-radius-md)] border border-dashed border-[var(--arena-border-soft)] bg-[var(--arena-surface-subtle)] px-3 py-3 text-xs font-medium text-[var(--arena-text-secondary)]">
            Crea un mezzo con destinazione Sharing per generare il link pubblico.
          </div>
        ) : (
          <div className="space-y-2">
            {canManage && (
              <>
                <Select
                  value={selectedLinkVehicle?.id ?? ''}
                  onValueChange={(value) => {
                    const nextVehicle = sharingVehicles.find((vehicle) => vehicle.id === value);
                    setSelectedLinkVehicleId(value);
                    setLinkSlugDraft(nextVehicle?.sharing_link_slug ?? normalizeSlug(nextVehicle?.plate ?? ''));
                  }}
                >
                  <SelectTrigger className="arena-dark-control h-8 w-full rounded-lg">
                    <SelectValue placeholder="Seleziona mezzo sharing" />
                  </SelectTrigger>
                  <SelectContent className="arena-dark-select-content">
                    {sharingVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.brand} {vehicle.model} · {vehicle.plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Input
                    value={linkSlugDraft}
                    placeholder="es. varese"
                    className="arena-dark-control h-8 rounded-lg text-xs"
                    onChange={(event) => setLinkSlugDraft(normalizeSlug(event.target.value))}
                  />
                  <Button className="arena-dark-accent-button h-8 shrink-0 gap-1 rounded-lg px-3" disabled={savingLink} onClick={handleSaveLink}>
                    <Save size={13} /> Salva
                  </Button>
                </div>
              </>
            )}
            <div className="rounded-[var(--arena-radius-md)] bg-[var(--arena-surface-subtle)] px-3 py-2">
              <p className="truncate text-xs font-medium text-[var(--arena-text-secondary)]">
                {publicLink ?? 'Configura lo slug e salva'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="arena-dark-outline-button h-8 gap-2 rounded-lg" onClick={copyLink}>
                <Copy size={13} /> Copia
              </Button>
              <Button variant="outline" className="arena-dark-outline-button h-8 gap-2 rounded-lg" onClick={openPublicLink}>
                <ExternalLink size={13} /> Apri
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
