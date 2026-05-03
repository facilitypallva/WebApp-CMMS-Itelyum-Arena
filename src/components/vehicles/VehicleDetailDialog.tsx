import { useEffect, useMemo, useState } from 'react';
import { Copy, Edit3, ExternalLink, FileText, Save, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { VehicleImageUploader } from '@/components/vehicles/VehicleImageUploader';
import { useAuth } from '@/contexts/AuthContext';
import type { useVehicles } from '@/hooks/useVehicles';
import { cn } from '@/lib/utils';
import { uploadVehiclePhoto } from '@/lib/vehiclePhotos';
import {
  AssignmentType,
  DeadlineType,
  Vehicle,
  VehicleAssignment,
  VehicleBooking,
  VehicleDeadline,
  VehicleMaintenance,
  VehicleStatus,
  VehicleWithDetails,
} from '@/types/vehicles';

type UseVehiclesResult = ReturnType<typeof useVehicles>;

type VehicleDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VehicleWithDetails | null;
  vehicles: VehicleWithDetails[];
  bookings: VehicleBooking[];
  initialTab?: 'anagrafica' | 'assegnazione' | 'scadenze' | 'manutenzione' | 'storico';
  updateVehicle: UseVehiclesResult['updateVehicle'];
  scheduleMaintenance: UseVehiclesResult['scheduleMaintenance'];
  upsertDeadline: UseVehiclesResult['upsertDeadline'];
  upsertAssignment: UseVehiclesResult['upsertAssignment'];
};

type VehicleForm = {
  brand: string;
  model: string;
  plate: string;
  year: string;
  vehicle_type: string;
  fuel_type: string;
  current_km: string;
};

type AssignmentForm = {
  assigned_to_name: string;
  assigned_to_role: string;
  assignment_category: 'staff' | 'giocatore';
  season: string;
  substitute_vehicle_id: string;
};

type DeadlineDraft = {
  expiry_date: string;
  next_km: string;
  document_url: string;
  notes: string;
};

type MaintenanceForm = {
  maintenance_type: string;
  start_date: string;
  end_date: string;
  notes: string;
};

const VEHICLE_TYPES = [
  { value: 'auto', label: 'Auto' },
  { value: 'furgone', label: 'Furgone' },
  { value: 'bus', label: 'Bus' },
  { value: 'altro', label: 'Altro' },
];

const FUEL_TYPES = [
  { value: 'benzina', label: 'Benzina' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'elettrico', label: 'Elettrico' },
  { value: 'ibrido', label: 'Ibrido' },
  { value: 'gpl', label: 'GPL' },
];

const DEADLINE_TYPES: DeadlineType[] = ['assicurazione', 'revisione', 'bollo', 'tagliando'];
const MAINTENANCE_TYPES = ['Tagliando', 'Revisione periodica', 'Cambio gomme', 'Riparazione', 'Altro'];

const STATUS_LABELS: Record<VehicleStatus, string> = {
  disponibile: 'Disponibile',
  in_uso: 'In uso',
  manutenzione: 'Manutenzione',
  fuori_servizio: 'Fuori servizio',
};

const ASSIGNMENT_LABELS: Record<AssignmentType, string> = {
  staff: 'Staff',
  giocatore: 'Giocatore',
  sharing: 'Sharing',
};

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'n/d';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function formatTime(value: string | null | undefined) {
  if (!value) return '';
  return value.slice(0, 5);
}

function daysUntil(dateKey: string) {
  const today = new Date(`${getDateKey()}T00:00:00`);
  const target = new Date(`${dateKey}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function getDeadlineClass(deadline: VehicleDeadline | { expiry_date: string | null }) {
  if (!deadline.expiry_date) return 'border-[var(--arena-border-soft)] bg-[var(--arena-surface-subtle)] text-[var(--arena-text-secondary)]';
  const days = daysUntil(deadline.expiry_date);
  if (days < 30) return 'border-[var(--arena-danger)]/25 bg-[var(--arena-danger-soft)] text-[var(--arena-danger)]';
  if (days <= 60) return 'border-[var(--arena-warning)]/25 bg-[var(--arena-warning-soft)] text-[var(--arena-warning)]';
  return 'border-[var(--arena-accent)]/25 bg-[var(--arena-accent-soft)] text-[var(--arena-accent)]';
}

function getDeadlineLabel(deadline: VehicleDeadline) {
  if (!deadline.expiry_date) return 'Non impostata';
  const days = daysUntil(deadline.expiry_date);
  if (days < 0) return `Scaduta da ${Math.abs(days)} gg`;
  if (days === 0) return 'Scade oggi';
  return `${days} gg`;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'NA';
}

function makeVehicleForm(vehicle: VehicleWithDetails): VehicleForm {
  return {
    brand: vehicle.brand,
    model: vehicle.model,
    plate: vehicle.plate,
    year: vehicle.year?.toString() ?? '',
    vehicle_type: vehicle.vehicle_type ?? '',
    fuel_type: vehicle.fuel_type ?? '',
    current_km: vehicle.current_km?.toString() ?? '0',
  };
}

function makeAssignmentForm(vehicle: VehicleWithDetails): AssignmentForm {
  return {
    assigned_to_name: vehicle.assignment?.assigned_to_name ?? '',
    assigned_to_role: vehicle.assignment?.assigned_to_role ?? '',
    assignment_category: vehicle.assignment?.assignment_category ?? (vehicle.assignment_type === 'giocatore' ? 'giocatore' : 'staff'),
    season: vehicle.assignment?.season ?? '',
    substitute_vehicle_id: vehicle.assignment?.substitute_vehicle_id ?? 'none',
  };
}

function makeDeadlineDraft(deadline?: VehicleDeadline | null): DeadlineDraft {
  return {
    expiry_date: deadline?.expiry_date ?? '',
    next_km: deadline?.next_km?.toString() ?? '',
    document_url: deadline?.document_url ?? '',
    notes: deadline?.notes ?? '',
  };
}

function makeMaintenanceForm(): MaintenanceForm {
  return {
    maintenance_type: 'Tagliando',
    start_date: getDateKey(),
    end_date: getDateKey(),
    notes: '',
  };
}

function normalizeNumber(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getVehicleName(vehicle: Vehicle | VehicleWithDetails | null | undefined) {
  if (!vehicle) return 'n/d';
  return `${vehicle.brand} ${vehicle.model}`;
}

export function VehicleDetailDialog({
  open,
  onOpenChange,
  vehicle,
  vehicles,
  bookings,
  initialTab = 'anagrafica',
  updateVehicle,
  scheduleMaintenance,
  upsertDeadline,
  upsertAssignment,
}: VehicleDetailDialogProps) {
  const { role } = useAuth();
  const canManage = role === 'ADMIN' || role === 'RESPONSABILE';
  const [editingVehicle, setEditingVehicle] = useState(false);
  const [vehicleForm, setVehicleForm] = useState<VehicleForm | null>(null);
  const [assignmentForm, setAssignmentForm] = useState<AssignmentForm | null>(null);
  const [editingDeadlineType, setEditingDeadlineType] = useState<DeadlineType | null>(null);
  const [deadlineDrafts, setDeadlineDrafts] = useState<Record<DeadlineType, DeadlineDraft>>({} as Record<DeadlineType, DeadlineDraft>);
  const [maintenanceForm, setMaintenanceForm] = useState<MaintenanceForm>(makeMaintenanceForm);
  const [vehiclePhotoFile, setVehiclePhotoFile] = useState<File | null>(null);
  const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState<string | null>(null);
  const [removeVehiclePhoto, setRemoveVehiclePhoto] = useState(false);
  const [sharingSlugDraft, setSharingSlugDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!vehicle) return;
    setEditingVehicle(false);
    setVehicleForm(makeVehicleForm(vehicle));
    setAssignmentForm(makeAssignmentForm(vehicle));
    setEditingDeadlineType(null);
    setDeadlineDrafts(DEADLINE_TYPES.reduce((acc, type) => {
      acc[type] = makeDeadlineDraft(vehicle.deadlines.find((deadline) => deadline.deadline_type === type));
      return acc;
    }, {} as Record<DeadlineType, DeadlineDraft>));
    setMaintenanceForm(makeMaintenanceForm());
    setVehiclePhotoFile(null);
    setVehiclePhotoPreview(null);
    setRemoveVehiclePhoto(false);
    setSharingSlugDraft(vehicle.sharing_link_slug ?? '');
  }, [vehicle]);

  const substituteOptions = useMemo(
    () => vehicles.filter((item) => item.id !== vehicle?.id && item.assignment_type !== 'sharing'),
    [vehicle?.id, vehicles]
  );

  const substituteVehicle = useMemo(
    () => vehicles.find((item) => item.id === vehicle?.assignment?.substitute_vehicle_id) ?? null,
    [vehicle?.assignment?.substitute_vehicle_id, vehicles]
  );

  const publicBookingLink = useMemo(() => {
    if (!vehicle?.sharing_link_slug) return null;
    return `${window.location.origin}/booking/${vehicle.sharing_link_slug}`;
  }, [vehicle?.sharing_link_slug]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const date = addDays(new Date(), index);
    const key = getDateKey(date);
    const activeBooking = bookings.find((booking) => (
      booking.vehicle_id === vehicle?.id && booking.status === 'approved' && booking.trip_date === key
    ));
    const activeMaintenance = vehicle?.maintenances.find((maintenance) => (
      maintenance.start_date <= key && maintenance.end_date >= key
    ));

    return { date, key, activeBooking, activeMaintenance };
  }), [bookings, vehicle?.id, vehicle?.maintenances]);

  const vehicleHistory = useMemo(() => {
    if (!vehicle) return [];

    const bookingItems = bookings
      .filter((booking) => (
        booking.vehicle_id === vehicle.id && (booking.status === 'approved' || booking.status === 'rejected')
      ))
      .map((booking) => ({
        id: booking.id,
        kind: 'booking' as const,
        date: booking.trip_date,
        booking,
        maintenance: null,
      }));

    const maintenanceItems = vehicle.maintenances.map((maintenance) => ({
      id: maintenance.id,
      kind: 'maintenance' as const,
      date: maintenance.start_date,
      booking: null,
      maintenance,
    }));

    return [...bookingItems, ...maintenanceItems].sort((a, b) => b.date.localeCompare(a.date));
  }, [bookings, vehicle]);

  if (!vehicle || !vehicleForm || !assignmentForm) {
    return null;
  }

  const handleVehicleSave = async () => {
    setSaving(true);
    try {
      const photoUrl = vehiclePhotoFile
        ? await uploadVehiclePhoto(vehiclePhotoFile, vehicle.id)
        : undefined;

      await updateVehicle(vehicle.id, {
        brand: vehicleForm.brand.trim(),
        model: vehicleForm.model.trim(),
        plate: vehicleForm.plate.trim(),
        year: normalizeNumber(vehicleForm.year),
        vehicle_type: (vehicleForm.vehicle_type || null) as Vehicle['vehicle_type'],
        fuel_type: (vehicleForm.fuel_type || null) as Vehicle['fuel_type'],
        current_km: normalizeNumber(vehicleForm.current_km) ?? 0,
        ...(photoUrl !== undefined ? { photo_url: photoUrl } : {}),
        ...(removeVehiclePhoto && !vehiclePhotoFile ? { photo_url: null } : {}),
      });
      setVehiclePhotoFile(null);
      setVehiclePhotoPreview(null);
      setRemoveVehiclePhoto(false);
      setEditingVehicle(false);
      toast.success('Anagrafica aggiornata');
    } catch (error) {
      console.error('Vehicle update failed', error);
      if (vehiclePhotoFile) {
        toast.error(error instanceof Error ? error.message : 'Errore nel caricamento immagine');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAssignmentSave = async () => {
    if (vehicle.assignment_type !== 'sharing' && !assignmentForm.assigned_to_name.trim()) {
      toast.error('Nome assegnatario obbligatorio');
      return;
    }

    setSaving(true);
    try {
      const payload: VehicleAssignment = {
        id: vehicle.assignment?.id ?? '',
        vehicle_id: vehicle.id,
        assigned_to_name: assignmentForm.assigned_to_name.trim(),
        assigned_to_role: assignmentForm.assigned_to_role.trim() || null,
        assignment_category: assignmentForm.assignment_category,
        season: assignmentForm.season.trim() || null,
        substitute_vehicle_id: assignmentForm.substitute_vehicle_id === 'none' ? null : assignmentForm.substitute_vehicle_id,
        active: vehicle.assignment?.active ?? true,
        created_at: vehicle.assignment?.created_at ?? null,
      };

      await upsertAssignment(vehicle.id, payload);
      toast.success('Assegnazione aggiornata');
    } finally {
      setSaving(false);
    }
  };

  const handleDeadlineSave = async (deadlineType: DeadlineType) => {
    const existing = vehicle.deadlines.find((deadline) => deadline.deadline_type === deadlineType);
    const draft = deadlineDrafts[deadlineType];

    setSaving(true);
    try {
      const payload: VehicleDeadline = {
        id: existing?.id ?? '',
        vehicle_id: vehicle.id,
        deadline_type: deadlineType,
        expiry_date: draft.expiry_date || null,
        next_km: normalizeNumber(draft.next_km),
        document_url: draft.document_url.trim() || null,
        notes: draft.notes.trim() || null,
        created_at: existing?.created_at ?? null,
      };

      await upsertDeadline(vehicle.id, payload);
      setEditingDeadlineType(null);
      toast.success('Scadenza aggiornata');
    } finally {
      setSaving(false);
    }
  };

  const handleMaintenanceSave = async () => {
    if (!maintenanceForm.maintenance_type || !maintenanceForm.start_date || !maintenanceForm.end_date) {
      toast.error('Tipo intervento e date sono obbligatori');
      return;
    }

    if (maintenanceForm.end_date < maintenanceForm.start_date) {
      toast.error('La data fine non può precedere la data inizio');
      return;
    }

    setSaving(true);
    try {
      await scheduleMaintenance(vehicle.id, {
        maintenance_type: maintenanceForm.maintenance_type,
        start_date: maintenanceForm.start_date,
        end_date: maintenanceForm.end_date,
        notes: maintenanceForm.notes.trim() || null,
      });
      setMaintenanceForm(makeMaintenanceForm());
      toast.success('Manutenzione programmata');
    } finally {
      setSaving(false);
    }
  };

  const copyPublicLink = async () => {
    if (!publicBookingLink) return;
    try {
      await navigator.clipboard.writeText(publicBookingLink);
      toast.success('Link copiato');
    } catch {
      toast.error('Impossibile copiare il link');
    }
  };

  const handleSharingSlugSave = async () => {
    const normalizedSlug = normalizeSlug(sharingSlugDraft || vehicle.plate);
    if (!normalizedSlug) {
      toast.error('Inserisci uno slug valido');
      return;
    }

    setSaving(true);
    try {
      await updateVehicle(vehicle.id, { sharing_link_slug: normalizedSlug });
      setSharingSlugDraft(normalizedSlug);
      toast.success('Link prenotazione aggiornato');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="arena-dark-dialog max-h-[92vh] overflow-y-auto p-0 sm:max-w-5xl">
        <DialogHeader className="border-b border-[var(--arena-border-soft)] px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <DialogTitle className="arena-heading text-xl font-semibold text-[var(--arena-text-primary)]">
                {vehicle.brand} {vehicle.model}
              </DialogTitle>
              <p className="mt-1 font-mono text-xs font-bold tracking-[0.16em] text-[var(--arena-accent)]">{vehicle.plate}</p>
            </div>
            <div className="flex flex-wrap gap-2 pr-8">
              <Badge className="rounded-full border border-[var(--arena-border-soft)] bg-[var(--arena-surface-subtle)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--arena-text-secondary)]">
                {ASSIGNMENT_LABELS[vehicle.assignment_type]}
              </Badge>
              <Badge className="rounded-full border border-[var(--arena-border-soft)] bg-[var(--arena-surface-elevated)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--arena-text-primary)]">
                {STATUS_LABELS[vehicle.status]}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs key={`${vehicle.id}-${initialTab}`} defaultValue={initialTab} className="gap-0">
          <div className="border-b border-[var(--arena-border-soft)] px-6 pt-3">
            <TabsList variant="line" className="h-10 gap-5 text-[var(--arena-text-secondary)]">
              <TabsTrigger value="anagrafica" className="px-0 text-[var(--arena-text-secondary)] hover:text-[var(--arena-text-primary)] data-active:text-[var(--arena-text-primary)] after:bg-[var(--arena-accent)]">Anagrafica</TabsTrigger>
              <TabsTrigger value="assegnazione" className="px-0 text-[var(--arena-text-secondary)] hover:text-[var(--arena-text-primary)] data-active:text-[var(--arena-text-primary)] after:bg-[var(--arena-accent)]">Assegnazione</TabsTrigger>
              <TabsTrigger value="scadenze" className="px-0 text-[var(--arena-text-secondary)] hover:text-[var(--arena-text-primary)] data-active:text-[var(--arena-text-primary)] after:bg-[var(--arena-accent)]">Scadenze</TabsTrigger>
              <TabsTrigger value="manutenzione" className="px-0 text-[var(--arena-text-secondary)] hover:text-[var(--arena-text-primary)] data-active:text-[var(--arena-text-primary)] after:bg-[var(--arena-accent)]">Manutenzione</TabsTrigger>
              <TabsTrigger value="storico" className="px-0 text-[var(--arena-text-secondary)] hover:text-[var(--arena-text-primary)] data-active:text-[var(--arena-text-primary)] after:bg-[var(--arena-accent)]">Storico</TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="anagrafica" className="mt-0 space-y-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="arena-heading text-base font-semibold text-[var(--arena-text-primary)]">Dati veicolo</h3>
                {canManage && (
                  <div className="flex gap-2">
                    {editingVehicle ? (
                      <>
                        <Button variant="outline" className="arena-dark-outline-button h-8 rounded-lg" onClick={() => {
                          setVehicleForm(makeVehicleForm(vehicle));
                          setVehiclePhotoFile(null);
                          setVehiclePhotoPreview(null);
                          setRemoveVehiclePhoto(false);
                          setEditingVehicle(false);
                        }}>
                          Annulla
                        </Button>
                        <Button className="arena-dark-accent-button h-8 gap-2 rounded-lg" disabled={saving} onClick={handleVehicleSave}>
                          <Save size={14} /> Salva
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" className="arena-dark-outline-button h-8 gap-2 rounded-lg" onClick={() => setEditingVehicle(true)}>
                        <Edit3 size={14} /> Modifica
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <VehicleImageUploader
                imageUrl={removeVehiclePhoto ? null : vehicle.photo_url}
                previewUrl={vehiclePhotoPreview}
                fileName={vehiclePhotoFile?.name}
                disabled={!editingVehicle || saving}
                uploading={saving}
                onFileSelect={(file, previewUrl) => {
                  setVehiclePhotoFile(file);
                  setVehiclePhotoPreview(previewUrl);
                  setRemoveVehiclePhoto(false);
                }}
                onRemove={() => {
                  setVehiclePhotoFile(null);
                  setVehiclePhotoPreview(null);
                  setRemoveVehiclePhoto(true);
                }}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Input value={vehicleForm.brand} disabled={!editingVehicle} onChange={(event) => setVehicleForm({ ...vehicleForm, brand: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Modello</Label>
                  <Input value={vehicleForm.model} disabled={!editingVehicle} onChange={(event) => setVehicleForm({ ...vehicleForm, model: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Targa</Label>
                  <Input value={vehicleForm.plate} disabled={!editingVehicle} onChange={(event) => setVehicleForm({ ...vehicleForm, plate: event.target.value.toUpperCase() })} />
                </div>
                <div className="space-y-2">
                  <Label>Anno</Label>
                  <Input type="number" value={vehicleForm.year} disabled={!editingVehicle} onChange={(event) => setVehicleForm({ ...vehicleForm, year: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo veicolo</Label>
                  <Select value={vehicleForm.vehicle_type || 'none'} onValueChange={(value) => setVehicleForm({ ...vehicleForm, vehicle_type: value === 'none' ? '' : value })} disabled={!editingVehicle}>
                    <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent className="arena-dark-select-content">
                      <SelectItem value="none">Non impostato</SelectItem>
                      {VEHICLE_TYPES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Alimentazione</Label>
                  <Select value={vehicleForm.fuel_type || 'none'} onValueChange={(value) => setVehicleForm({ ...vehicleForm, fuel_type: value === 'none' ? '' : value })} disabled={!editingVehicle}>
                    <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent className="arena-dark-select-content">
                      <SelectItem value="none">Non impostata</SelectItem>
                      {FUEL_TYPES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Km attuali</Label>
                  <Input type="number" value={vehicleForm.current_km} disabled={!editingVehicle} onChange={(event) => setVehicleForm({ ...vehicleForm, current_km: event.target.value })} />
                </div>
              </div>

              <section className="space-y-3">
                <h3 className="arena-heading text-base font-semibold text-[var(--arena-text-primary)]">Documenti</h3>
                <div className="grid gap-2">
                  {vehicle.deadlines.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[var(--arena-border-soft)] bg-[var(--arena-surface-subtle)] p-4 text-sm text-[var(--arena-text-muted)]">Nessun documento caricato</div>
                  ) : vehicle.deadlines.map((deadline) => (
                    <div key={deadline.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--arena-border-soft)] bg-[var(--arena-surface-subtle)] px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold capitalize text-[var(--arena-text-primary)]">{deadline.deadline_type}</p>
                        <p className="text-xs text-[var(--arena-text-muted)]">{formatDate(deadline.expiry_date)}</p>
                      </div>
                      {deadline.document_url ? (
                        <a
                          href={deadline.document_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-[var(--arena-border-soft)] bg-[var(--arena-surface-subtle)] px-3 text-sm font-medium text-[var(--arena-text-primary)] transition-colors hover:bg-[var(--arena-surface-elevated)]"
                        >
                          <FileText size={14} /> Visualizza PDF <ExternalLink size={13} />
                        </a>
                      ) : (
                        <span className="text-xs font-medium text-[var(--arena-text-muted)]">PDF non disponibile</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </TabsContent>

            <TabsContent value="assegnazione" className="mt-0 space-y-6">
              {vehicle.assignment_type === 'sharing' ? (
                <div className="space-y-4">
                  <div className="rounded-[var(--arena-radius-lg)] border border-[var(--arena-accent)]/25 bg-[var(--arena-accent-soft)] p-5">
                    <p className="text-sm font-semibold text-[var(--arena-text-primary)]">Sharing — prenotabile</p>
                    <p className="mt-1 text-sm text-[var(--arena-accent)]">{publicBookingLink ?? 'Slug pubblico non configurato'}</p>
                  </div>
                  {canManage && (
                    <div className="grid grid-cols-1 gap-3 rounded-[var(--arena-radius-lg)] border border-[var(--arena-border-soft)] bg-[var(--arena-surface-subtle)] p-4 md:grid-cols-[1fr_auto]">
                      <div className="space-y-2">
                        <Label>Slug link pubblico</Label>
                        <Input
                          value={sharingSlugDraft}
                          placeholder="es. varese"
                          onChange={(event) => setSharingSlugDraft(normalizeSlug(event.target.value))}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button className="arena-dark-accent-button h-9 gap-2 rounded-lg" disabled={saving} onClick={handleSharingSlugSave}>
                          <Save size={14} /> Salva link
                        </Button>
                      </div>
                    </div>
                  )}
                  {publicBookingLink && (
                    <Button variant="outline" className="arena-dark-outline-button gap-2 rounded-lg" onClick={copyPublicLink}>
                      <Copy size={14} /> Copia link pubblico
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-4 rounded-[var(--arena-radius-lg)] border border-[var(--arena-border-soft)] bg-[var(--arena-surface-subtle)] p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                      {getInitials(assignmentForm.assigned_to_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--arena-text-primary)]">{assignmentForm.assigned_to_name || 'Nessuna assegnazione'}</p>
                      <p className="text-sm text-[var(--arena-text-muted)]">{assignmentForm.assigned_to_role || 'Ruolo non indicato'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input value={assignmentForm.assigned_to_name} disabled={!canManage} onChange={(event) => setAssignmentForm({ ...assignmentForm, assigned_to_name: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Ruolo</Label>
                      <Input value={assignmentForm.assigned_to_role} disabled={!canManage} onChange={(event) => setAssignmentForm({ ...assignmentForm, assigned_to_role: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={assignmentForm.assignment_category} onValueChange={(value) => setAssignmentForm({ ...assignmentForm, assignment_category: value as 'staff' | 'giocatore' })} disabled={!canManage}>
                        <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                        <SelectContent className="arena-dark-select-content">
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="giocatore">Giocatore</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Stagione</Label>
                      <Input value={assignmentForm.season} disabled={!canManage} onChange={(event) => setAssignmentForm({ ...assignmentForm, season: event.target.value })} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Veicolo sostitutivo</Label>
                      <Select value={assignmentForm.substitute_vehicle_id} onValueChange={(value) => setAssignmentForm({ ...assignmentForm, substitute_vehicle_id: value })} disabled={!canManage}>
                        <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                        <SelectContent className="arena-dark-select-content">
                          <SelectItem value="none">Nessun sostitutivo</SelectItem>
                          {substituteOptions.map((item) => (
                            <SelectItem key={item.id} value={item.id}>{getVehicleName(item)} · {item.plate}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {canManage && (
                    <Button className="arena-dark-accent-button gap-2 rounded-lg" disabled={saving} onClick={handleAssignmentSave}>
                      <Save size={14} /> Salva assegnazione
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="scadenze" className="mt-0 space-y-6">
              <div className="space-y-3">
                {DEADLINE_TYPES.map((deadlineType) => {
                  const existing = vehicle.deadlines.find((deadline) => deadline.deadline_type === deadlineType);
                  const draft = deadlineDrafts[deadlineType] ?? makeDeadlineDraft(existing);
                  const isEditing = editingDeadlineType === deadlineType;

                  return (
                    <div key={deadlineType} className="rounded-[var(--arena-radius-lg)] border border-[var(--arena-border-soft)] bg-[var(--arena-surface-subtle)] p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold capitalize text-[var(--arena-text-primary)]">{deadlineType}</p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <Badge className={cn('rounded-full border px-2.5 py-1 text-[10px] font-bold', getDeadlineClass(existing ?? { expiry_date: null }))}>
                              {existing ? getDeadlineLabel(existing) : 'Non impostata'}
                            </Badge>
                            {existing?.next_km && (
                              <Badge className="rounded-full border border-[var(--arena-border-soft)] bg-[var(--arena-surface-elevated)] px-2.5 py-1 text-[10px] font-semibold text-[var(--arena-text-secondary)]">
                                {existing.next_km.toLocaleString('it-IT')} km
                              </Badge>
                            )}
                          </div>
                        </div>
                        {canManage && (
                          <Button variant="outline" className="arena-dark-outline-button h-8 gap-2 rounded-lg" onClick={() => setEditingDeadlineType(isEditing ? null : deadlineType)}>
                            <Edit3 size={14} /> {isEditing ? 'Chiudi' : 'Modifica'}
                          </Button>
                        )}
                      </div>

                      {isEditing && (
                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Data scadenza</Label>
                            <Input type="date" value={draft.expiry_date} onChange={(event) => setDeadlineDrafts({ ...deadlineDrafts, [deadlineType]: { ...draft, expiry_date: event.target.value } })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Km prossimo tagliando</Label>
                            <Input type="number" value={draft.next_km} onChange={(event) => setDeadlineDrafts({ ...deadlineDrafts, [deadlineType]: { ...draft, next_km: event.target.value } })} />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>PDF allegato</Label>
                            <Input value={draft.document_url} placeholder="https://..." onChange={(event) => setDeadlineDrafts({ ...deadlineDrafts, [deadlineType]: { ...draft, document_url: event.target.value } })} />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Note</Label>
                            <Textarea value={draft.notes} onChange={(event) => setDeadlineDrafts({ ...deadlineDrafts, [deadlineType]: { ...draft, notes: event.target.value } })} />
                          </div>
                          <div className="md:col-span-2">
                            <Button className="arena-dark-accent-button h-8 gap-2 rounded-lg" disabled={saving} onClick={() => handleDeadlineSave(deadlineType)}>
                              <Save size={14} /> Salva scadenza
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <section className="space-y-3">
                <h3 className="arena-heading text-base font-semibold text-[var(--arena-text-primary)]">Calendario settimanale</h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
                  {weekDays.map((day) => {
                    const status = day.activeMaintenance ? 'Manutenzione' : day.activeBooking ? 'In uso' : 'Libero';
                    const cls = day.activeMaintenance
                      ? 'border-[var(--arena-warning)]/25 bg-[var(--arena-warning-soft)] text-[var(--arena-warning)]'
                      : day.activeBooking
                        ? 'border-[var(--arena-info)]/25 bg-[var(--arena-info-soft)] text-[var(--arena-info)]'
                        : 'border-[var(--arena-accent)]/25 bg-[var(--arena-accent-soft)] text-[var(--arena-accent)]';

                    return (
                      <div key={day.key} className={cn('rounded-lg border p-3 text-center', cls)}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em]">{new Intl.DateTimeFormat('it-IT', { weekday: 'short' }).format(day.date)}</p>
                        <p className="mt-1 text-sm font-bold">{day.date.getDate()}</p>
                        <p className="mt-2 text-[11px] font-semibold">{status}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            </TabsContent>

            <TabsContent value="manutenzione" className="mt-0 space-y-6">
              <div className="rounded-[var(--arena-radius-lg)] border border-[var(--arena-border-soft)] bg-[var(--arena-surface-subtle)] p-5">
                <h3 className="arena-heading mb-4 text-base font-semibold text-[var(--arena-text-primary)]">Nuova manutenzione</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo intervento</Label>
                    <Select value={maintenanceForm.maintenance_type} onValueChange={(value) => setMaintenanceForm({ ...maintenanceForm, maintenance_type: value })}>
                      <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                      <SelectContent className="arena-dark-select-content">
                        {MAINTENANCE_TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data inizio</Label>
                    <Input type="date" value={maintenanceForm.start_date} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, start_date: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Data fine</Label>
                    <Input type="date" value={maintenanceForm.end_date} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, end_date: event.target.value })} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Note</Label>
                    <Textarea value={maintenanceForm.notes} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, notes: event.target.value })} />
                  </div>
                </div>
                <p className="mt-4 rounded-lg border border-[var(--arena-warning)]/20 bg-[var(--arena-warning-soft)] px-4 py-3 text-sm font-medium text-[var(--arena-warning)]">
                  Il veicolo sarà automaticamente bloccato nelle date indicate. Il sostitutivo {substituteVehicle ? getVehicleName(substituteVehicle) : 'non configurato'} verrà attivato.
                </p>
                <Button className="arena-dark-accent-button mt-4 gap-2 rounded-lg" disabled={saving} onClick={handleMaintenanceSave}>
                  <Wrench size={14} /> Programma manutenzione
                </Button>
              </div>

              <section className="space-y-3">
                <h3 className="arena-heading text-base font-semibold text-[var(--arena-text-primary)]">Storico manutenzioni</h3>
                <div className="space-y-2">
                  {[...vehicle.maintenances].sort((a, b) => b.start_date.localeCompare(a.start_date)).map((maintenance) => (
                    <div key={maintenance.id} className="rounded-lg border border-[var(--arena-border-soft)] bg-[var(--arena-surface-subtle)] px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-[var(--arena-text-primary)]">{maintenance.maintenance_type}</p>
                        <Badge className={cn('rounded-full px-2.5 py-1 text-[10px] font-semibold', maintenance.completed ? 'bg-[var(--arena-accent-soft)] text-[var(--arena-accent)]' : 'bg-[var(--arena-warning-soft)] text-[var(--arena-warning)]')}>
                          {maintenance.completed ? 'Completata' : 'Programmata'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--arena-text-muted)]">{formatDate(maintenance.start_date)} → {formatDate(maintenance.end_date)}</p>
                      {maintenance.notes && <p className="mt-2 text-sm text-[var(--arena-text-secondary)]">{maintenance.notes}</p>}
                    </div>
                  ))}
                  {vehicle.maintenances.length === 0 && (
                    <div className="rounded-lg border border-dashed border-[var(--arena-border-soft)] bg-[var(--arena-surface-subtle)] p-4 text-sm text-[var(--arena-text-muted)]">Nessuna manutenzione registrata</div>
                  )}
                </div>
              </section>
            </TabsContent>

            <TabsContent value="storico" className="mt-0">
              <div className="space-y-3">
                {vehicleHistory.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[var(--arena-border-soft)] bg-[var(--arena-surface-subtle)] p-6 text-center text-sm text-[var(--arena-text-muted)]">Nessuno storico disponibile</div>
                ) : vehicleHistory.map((item) => {
                  if (item.kind === 'maintenance') {
                    const maintenance = item.maintenance as VehicleMaintenance;
                    return (
                      <div key={item.id} className="flex gap-3 rounded-[var(--arena-radius-lg)] border border-[var(--arena-border-soft)] bg-[var(--arena-surface-subtle)] p-4">
                        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--arena-warning)]" />
                        <div>
                          <p className="font-semibold text-[var(--arena-text-primary)]">{maintenance.maintenance_type}</p>
                          <p className="text-sm text-[var(--arena-text-muted)]">{formatDate(maintenance.start_date)} → {formatDate(maintenance.end_date)}</p>
                          {maintenance.notes && <p className="mt-1 text-sm text-[var(--arena-text-secondary)]">{maintenance.notes}</p>}
                        </div>
                      </div>
                    );
                  }

                  const booking = item.booking as VehicleBooking;
                  const dotClass = booking.status === 'approved' ? 'bg-[var(--arena-accent)]' : 'bg-[var(--arena-danger)]';
                  return (
                    <div key={item.id} className="flex gap-3 rounded-[var(--arena-radius-lg)] border border-[var(--arena-border-soft)] bg-[var(--arena-surface-subtle)] p-4">
                      <span className={cn('mt-1 h-2.5 w-2.5 shrink-0 rounded-full', dotClass)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-[var(--arena-text-primary)]">{booking.requester_name} {booking.requester_surname}</p>
                          <span className="font-mono text-xs font-bold tracking-[0.12em] text-[var(--arena-accent)]">{booking.booking_code ?? 'PV-...'}</span>
                        </div>
                        <p className="mt-1 text-sm text-[var(--arena-text-secondary)]">{booking.departure} → {booking.destination}</p>
                        <p className="mt-1 text-xs font-medium text-[var(--arena-text-muted)]">{formatDate(booking.trip_date)} · {formatTime(booking.departure_time)}{booking.return_time ? `-${formatTime(booking.return_time)}` : ''}</p>
                        <p className="mt-2 text-sm text-[var(--arena-text-secondary)]">{booking.reason}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
