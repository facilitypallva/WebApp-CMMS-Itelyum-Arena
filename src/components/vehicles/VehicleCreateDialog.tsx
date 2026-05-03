import { useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AssignmentType, Vehicle } from '@/types/vehicles';
import { VehicleImageUploader } from '@/components/vehicles/VehicleImageUploader';
import { uploadVehiclePhoto } from '@/lib/vehiclePhotos';

type CreateVehicleData = Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>;

type VehicleCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createVehicle: (data: CreateVehicleData) => Promise<void>;
};

type VehicleCreateForm = {
  brand: string;
  model: string;
  plate: string;
  year: string;
  vehicle_type: string;
  fuel_type: string;
  current_km: string;
  assignment_type: AssignmentType;
  sharing_link_slug: string;
};

const EMPTY_FORM: VehicleCreateForm = {
  brand: '',
  model: '',
  plate: '',
  year: '',
  vehicle_type: '',
  fuel_type: '',
  current_km: '0',
  assignment_type: 'staff',
  sharing_link_slug: '',
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

export function VehicleCreateDialog({ open, onOpenChange, createVehicle }: VehicleCreateDialogProps) {
  const [form, setForm] = useState<VehicleCreateForm>(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const updateForm = (field: keyof VehicleCreateForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const closeAndReset = () => {
    setForm(EMPTY_FORM);
    setPhotoFile(null);
    setPhotoPreview(null);
    onOpenChange(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.brand.trim() || !form.model.trim() || !form.plate.trim()) {
      toast.error('Marca, modello e targa sono obbligatori');
      return;
    }

    const sharingSlug = form.assignment_type === 'sharing'
      ? normalizeSlug(form.sharing_link_slug || form.plate)
      : null;

    setSaving(true);
    try {
      const photoUrl = photoFile
        ? await uploadVehiclePhoto(photoFile, form.plate || `${form.brand}-${form.model}`)
        : null;

      await createVehicle({
        facility_id: null,
        brand: form.brand.trim(),
        model: form.model.trim(),
        plate: form.plate.trim().toUpperCase(),
        year: normalizeNumber(form.year),
        vehicle_type: (form.vehicle_type || null) as Vehicle['vehicle_type'],
        fuel_type: (form.fuel_type || null) as Vehicle['fuel_type'],
        current_km: normalizeNumber(form.current_km) ?? 0,
        photo_url: photoUrl,
        assignment_type: form.assignment_type,
        status: 'disponibile',
        sharing_link_slug: sharingSlug,
      });
      toast.success('Veicolo creato');
      closeAndReset();
    } catch (error) {
      console.error('Vehicle create failed', error);
      if (error instanceof Error && error.message.includes('Bucket not found')) {
        toast.error('Bucket immagini veicoli non configurato');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) {
        closeAndReset();
        return;
      }
      onOpenChange(nextOpen);
    }}>
      <DialogContent className="bg-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="arena-heading text-xl font-bold text-slate-950">Nuovo veicolo</DialogTitle>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <VehicleImageUploader
            imageUrl={null}
            previewUrl={photoPreview}
            fileName={photoFile?.name}
            disabled={saving}
            uploading={saving}
            onFileSelect={(file, previewUrl) => {
              setPhotoFile(file);
              setPhotoPreview(previewUrl);
            }}
            onRemove={() => {
              setPhotoFile(null);
              setPhotoPreview(null);
            }}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vehicle-brand">Marca *</Label>
              <Input id="vehicle-brand" value={form.brand} onChange={(event) => updateForm('brand', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-model">Modello *</Label>
              <Input id="vehicle-model" value={form.model} onChange={(event) => updateForm('model', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-plate">Targa *</Label>
              <Input id="vehicle-plate" value={form.plate} onChange={(event) => updateForm('plate', event.target.value.toUpperCase())} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-year">Anno</Label>
              <Input id="vehicle-year" type="number" value={form.year} onChange={(event) => updateForm('year', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo veicolo</Label>
              <Select value={form.vehicle_type || 'none'} onValueChange={(value) => updateForm('vehicle_type', value === 'none' ? '' : value)}>
                <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non impostato</SelectItem>
                  {VEHICLE_TYPES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Alimentazione</Label>
              <Select value={form.fuel_type || 'none'} onValueChange={(value) => updateForm('fuel_type', value === 'none' ? '' : value)}>
                <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Non impostata</SelectItem>
                  {FUEL_TYPES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-km">Km attuali</Label>
              <Input id="vehicle-km" type="number" value={form.current_km} onChange={(event) => updateForm('current_km', event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Destinazione</Label>
              <Select value={form.assignment_type} onValueChange={(value) => updateForm('assignment_type', value)}>
                <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="giocatore">Giocatore</SelectItem>
                  <SelectItem value="sharing">Sharing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.assignment_type === 'sharing' && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="vehicle-slug">Slug link pubblico</Label>
                <Input
                  id="vehicle-slug"
                  placeholder="es. varese"
                  value={form.sharing_link_slug}
                  onChange={(event) => updateForm('sharing_link_slug', normalizeSlug(event.target.value))}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="outline" className="rounded-lg" onClick={closeAndReset}>
              Annulla
            </Button>
            <Button type="submit" className="gap-2 rounded-lg bg-primary" disabled={saving}>
              <Save size={14} /> Salva veicolo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
