import React, { useEffect, useState, useMemo } from 'react';
import { Filter, Plus, MoreHorizontal, Eye, Edit, Trash2, MapPin, QrCode, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedSaveButton } from '@/components/ui/animated-save-button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Asset, AssetCategory, AssetStatus } from '@/types';
import { cn } from '@/lib/utils';
import { useAssets } from '@/hooks/useAssets';
import { useLocations } from '@/hooks/useLocations';
import { AssetCategoryIcon } from '@/components/assets/AssetCategoryIcon';
import { toast } from 'sonner';
import { getNextVerificationDate, parseAssetSerial } from '@/lib/assetUtils';
import { differenceInDays, format } from 'date-fns';
import { it } from 'date-fns/locale';

const CATEGORIES: AssetCategory[] = ['Rivelazione incendi', 'Antincendio', 'Meccanico', 'Elettrico', 'TVCC'];

const LOCATION_LABELS: Record<string, string> = {
  CR2: 'Corridoio 2',
  CR3: 'Corridoio 3',
  CR4: 'Corridoio 4',
  CR5: 'Corridoio 5',
  GD1: 'Guardiola',
  IF1: 'IF1',
  IF2: 'IF2',
  PL1: 'Palestra 1',
  SC1: 'SC1',
  SLV1: 'SLV1',
  SP1: 'Spogliatoio 1',
  SP2: 'Spogliatoio 2',
  SP3: 'Spogliatoio 3',
  SP4: 'Spogliatoio 4',
  SP5: 'Spogliatoio 5',
  SP6: 'Spogliatoio 6',
  UF1: 'Ufficio 1',
  UF2: 'Ufficio 2',
  UF3: 'Ufficio 3',
  UF4: 'Ufficio 4',
  UF5: 'Ufficio 5',
  UF6: 'Ufficio 6',
  WC1: 'Bagno 1',
  WC2: 'Bagno 2',
  WC3: 'Bagno 3',
  WC4: 'Bagno 4',
  WC5: 'Bagno 5',
  WC6: 'Bagno 6',
  WC7: 'Bagno 7',
};

const LOCATION_CODES = [
  'CR2', 'CR3', 'CR4', 'CR5', 'GD1', 'IF1', 'IF2', 'PL1', 'SC1', 'SLV1',
  'SP1', 'SP2', 'SP3', 'SP4', 'SP5', 'SP6',
  'UF1', 'UF2', 'UF3', 'UF4', 'UF5', 'UF6',
  'WC1', 'WC2', 'WC3', 'WC4', 'WC5', 'WC6', 'WC7',
] as const;

function formatLocationDisplayName(locationName: string | null | undefined) {
  if (!locationName) return '—';

  const normalized = locationName.replace(/^00_/, '').trim().toUpperCase();
  const mappedLabel = LOCATION_LABELS[normalized];
  if (mappedLabel) return mappedLabel;

  const officeMatch = normalized.match(/^UF(\d+)$/);
  if (officeMatch) return `Ufficio ${officeMatch[1]}`;

  const wcMatch = normalized.match(/^WC(\d+)$/);
  if (wcMatch) return `WC ${wcMatch[1]}`;

  return normalized;
}

function StatusBadge({ status }: { status: AssetStatus }) {
  const cls =
    status === 'IN REGOLA' ? 'bg-emerald-100 text-emerald-700' :
    status === 'IN SCADENZA' ? 'bg-amber-100 text-amber-700' :
    status === 'IN LAVORAZIONE' ? 'bg-blue-100 text-blue-700' :
    'bg-red-100 text-red-700';
  return (
    <Badge className={cn(cls, 'gap-1.5 border-none rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-[0.16em]')}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </Badge>
  );
}

function getStatusAccent(status: AssetStatus) {
  if (status === 'SCADUTO') return 'border-l-red-500';
  if (status === 'IN SCADENZA') return 'border-l-amber-500';
  if (status === 'IN LAVORAZIONE') return 'border-l-blue-500';
  return 'border-l-emerald-500';
}

function formatDueLabel(nextDate: Date | null) {
  if (!nextDate) return '—';
  const days = differenceInDays(nextDate, new Date());
  if (days < 0) return `${Math.abs(days)} gg fa`;
  if (days === 0) return 'oggi';
  return `tra ${days} gg`;
}

function getCategoryFilterLabel(value: AssetCategory | 'ALL') {
  return value === 'ALL' ? 'Categoria · Tutte' : value;
}

function getLocationFilterLabel(value: string) {
  return value === 'ALL' ? 'Localizzazione · Tutte' : formatLocationDisplayName(value);
}

function getStatusFilterLabel(value: AssetStatus | 'ALL') {
  return value === 'ALL' ? 'Stato · Tutti' : value;
}

function getDueFilterLabel(value: 'ALL' | '30' | '90' | 'OVERDUE') {
  if (value === '30') return 'Scadenza · 30gg';
  if (value === '90') return 'Scadenza · 90gg';
  if (value === 'OVERDUE') return 'Scaduti';
  return 'Scadenza · Tutte';
}

const EMPTY_FORM = {
  name: '', category: '' as AssetCategory, brand: '', model: '',
  serial_number: '', location_id: '', installation_date: '',
  last_verification: '', verification_frequency_code: '', verification_frequency_days: 180, verification_frequency_months: 6,
};

function normalizeOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeOptionalDate(value: string) {
  return value ? value : null;
}

export function AssetsTable({
  globalSearch = '',
}: {
  globalSearch?: string;
}) {
  const { assets, loading, createAsset, updateAsset, deleteAsset } = useAssets();
  const { locations } = useLocations();
  const [localSearch, setLocalSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<AssetStatus | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState<AssetCategory | 'ALL'>('ALL');
  const [filterLocation, setFilterLocation] = useState<string>('ALL');
  const [filterDue, setFilterDue] = useState<'ALL' | '30' | '90' | 'OVERDUE'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);

  const locationsById = useMemo(
    () => new Map(locations.map((location) => [location.id, location])),
    [locations]
  );

  const locationsByCode = useMemo(
    () => new Map(locations.map((location) => [location.name.replace(/^00_/, '').toUpperCase(), location])),
    [locations]
  );

  const selectedLocation = useMemo(
    () => locationsById.get(form.location_id) ?? null,
    [locationsById, form.location_id]
  );
  const selectedLocationLabel = selectedLocation ? formatLocationDisplayName(selectedLocation.name) : '';

  const filtered = useMemo(() => {
    const q = [globalSearch, localSearch].filter(Boolean).join(' ').trim().toLowerCase();

    return assets.filter((asset) => {
      const locationName =
        locationsById.get(asset.location_id)?.name ??
        (asset as { location?: { name?: string | null } }).location?.name ??
        parseAssetSerial(asset.serial_number)?.locationCode ??
        '';
      const locationCode = locationName.replace(/^00_/, '').toUpperCase();
      const haystack = [
        asset.name,
        asset.serial_number,
        asset.brand,
        asset.model,
        asset.category,
        locationName,
        formatLocationDisplayName(locationName),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const nextDate = getNextVerificationDate(asset.last_verification, asset.verification_frequency_days);
      const daysToDue = nextDate ? differenceInDays(nextDate, new Date()) : null;

      const matchSearch = !q || haystack.includes(q);
      const matchStatus = filterStatus === 'ALL' || asset.status === filterStatus;
      const matchCategory = filterCategory === 'ALL' || asset.category === filterCategory;
      const matchLocation = filterLocation === 'ALL' || locationCode === filterLocation;
      const matchDue =
        filterDue === 'ALL' ||
        (filterDue === 'OVERDUE' && daysToDue !== null && daysToDue < 0) ||
        (filterDue === '30' && daysToDue !== null && daysToDue >= 0 && daysToDue <= 30) ||
        (filterDue === '90' && daysToDue !== null && daysToDue >= 0 && daysToDue <= 90);

      return matchSearch && matchStatus && matchCategory && matchLocation && matchDue;
    });
  }, [assets, globalSearch, localSearch, filterCategory, filterDue, filterLocation, filterStatus, locationsById]);

  const locationOptions = useMemo(
    () => locations
      .map((loc) => ({
        id: loc.id,
        label: formatLocationDisplayName(loc.name),
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    [locations]
  );

  const parsedSerial = useMemo(() => parseAssetSerial(form.serial_number), [form.serial_number]);
  const serialMatchesLocation = parsedSerial && selectedLocation
    ? selectedLocation.name.replace(/^00_/, '') === parsedSerial.locationCode
    : null;

  const resolveLocationId = (asset: Asset) => {
    if (asset.location_id && locationsById.has(asset.location_id)) {
      return asset.location_id;
    }

    const parsed = parseAssetSerial(asset.serial_number);
    if (!parsed) return asset.location_id ?? '';

    const matchedLocation = locationsByCode.get(parsed.locationCode);

    return matchedLocation?.id ?? asset.location_id ?? '';
  };

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (a: Asset) => {
    setEditing(a);
    setForm({
      name: a.name, category: a.category, brand: a.brand ?? '', model: a.model ?? '',
      serial_number: a.serial_number ?? '', location_id: resolveLocationId(a),
      installation_date: a.installation_date ?? '', last_verification: a.last_verification ?? '',
      verification_frequency_code: a.verification_frequency_code ?? '',
      verification_frequency_days: a.verification_frequency_days,
      verification_frequency_months: a.verification_frequency_months,
    });
    setModalOpen(true);
  };

  useEffect(() => {
    if (!modalOpen || !parsedSerial) return;

    const matchingLocation = locationsByCode.get(parsedSerial.locationCode);
    if (!matchingLocation) return;

    // Imposta l'ubicazione automaticamente solo se il campo è ancora vuoto.
    // Se l'utente ha già scelto qualcosa, non sovrascrivere.
    if (!form.location_id) {
      setForm((current) => ({ ...current, location_id: matchingLocation.id }));
    }
  }, [modalOpen, parsedSerial, locationsByCode, form.location_id, selectedLocation]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.category) {
      toast.error('Nome e categoria sono obbligatori');
      return;
    }

    const resolvedLocationId =
      form.location_id ||
      (parsedSerial ? locationsByCode.get(parsedSerial.locationCode)?.id ?? '' : '');

    if (!resolvedLocationId) {
      toast.error('Seleziona un\'ubicazione valida per l\'asset');
      return;
    }

    setSaving(true);

    try {
      const frequencyDays = Number(form.verification_frequency_days);
      const safeFrequencyDays = Number.isFinite(frequencyDays) && frequencyDays > 0 ? frequencyDays : 180;

      const payload = {
        name: form.name.trim(),
        category: form.category,
        brand: normalizeOptionalText(form.brand),
        model: normalizeOptionalText(form.model),
        serial_number: normalizeOptionalText(form.serial_number.toUpperCase()),
        location_id: resolvedLocationId,
        installation_date: normalizeOptionalDate(form.installation_date),
        last_verification: normalizeOptionalDate(form.last_verification),
        verification_frequency_code: normalizeOptionalText(form.verification_frequency_code),
        verification_frequency_days: safeFrequencyDays,
        verification_frequency_months: Math.max(1, Math.round(safeFrequencyDays / 30)),
        documents: [] as string[],
      };

      const { error } = editing
        ? await updateAsset(editing.id, payload)
        : await createAsset(payload);

      if (error) {
        console.error('Asset save error', error);
        toast.error('Errore nel salvataggio asset');
        return;
      }

      toast.success(editing ? 'Asset aggiornato' : 'Asset creato');
      setModalOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Eliminare "${name}"? L'operazione è irreversibile.`)) return;
    const { error } = await deleteAsset(id);
    if (error) toast.error('Errore durante l\'eliminazione');
    else toast.success('Asset eliminato');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="arena-kicker">{assets.length.toLocaleString('it-IT')} asset · {CATEGORIES.length} categorie</p>
          <h2 className="arena-heading mt-1 text-4xl">Asset</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-lg border-primary/30 bg-white px-5 font-semibold text-primary hover:bg-primary/5"
            onClick={() => toast.info('Scanner QR non configurato in locale')}
          >
            <QrCode size={17} />
            Scansiona QR
          </Button>
          <Button className="h-11 rounded-lg bg-primary px-6 font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 gap-2" onClick={openCreate}>
            <Plus size={18} /> Nuovo asset
          </Button>
        </div>
      </div>

      <div className="arena-card p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 xl:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              value={localSearch}
              onChange={(event) => setLocalSearch(event.target.value)}
              placeholder="Cerca..."
              className="h-11 rounded-lg border-slate-200 bg-slate-50 pl-10 shadow-none"
            />
          </div>
          <Select value={filterCategory} onValueChange={(value) => setFilterCategory(value as AssetCategory | 'ALL')}>
            <SelectTrigger className="h-11 w-full rounded-lg border-slate-200 bg-white sm:w-48">
              <span className="truncate text-left">{getCategoryFilterLabel(filterCategory)}</span>
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="ALL">Categoria · Tutte</SelectItem>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className="h-11 w-full rounded-lg border-slate-200 bg-white sm:w-56">
              <span className="truncate text-left">{getLocationFilterLabel(filterLocation)}</span>
            </SelectTrigger>
            <SelectContent className="max-h-72 rounded-lg">
              <SelectItem value="ALL">Localizzazione · Tutte</SelectItem>
              {LOCATION_CODES.map((code) => (
                <SelectItem key={code} value={code}>{formatLocationDisplayName(code)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as AssetStatus | 'ALL')}>
            <SelectTrigger className="h-11 w-full rounded-lg border-slate-200 bg-white sm:w-44">
              <span className="truncate text-left">{getStatusFilterLabel(filterStatus)}</span>
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="ALL">Stato · Tutti</SelectItem>
              <SelectItem value="IN REGOLA">In Regola</SelectItem>
              <SelectItem value="IN SCADENZA">In Scadenza</SelectItem>
              <SelectItem value="SCADUTO">Scaduto</SelectItem>
              <SelectItem value="IN LAVORAZIONE">In Lavorazione</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterDue} onValueChange={(value) => setFilterDue(value as typeof filterDue)}>
            <SelectTrigger className="h-11 w-full rounded-lg border-slate-200 bg-white sm:w-52">
              <Filter size={15} className="mr-2 text-slate-400" />
              <span className="truncate text-left">{getDueFilterLabel(filterDue)}</span>
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="ALL">Scadenza · Tutte</SelectItem>
              <SelectItem value="30">Scadenza · 30gg</SelectItem>
              <SelectItem value="90">Scadenza · 90gg</SelectItem>
              <SelectItem value="OVERDUE">Scaduti</SelectItem>
            </SelectContent>
          </Select>
          <div className="shrink-0 whitespace-nowrap text-sm font-medium text-slate-500 xl:ml-auto xl:text-right">
            1-{filtered.length.toLocaleString('it-IT')} di {assets.length.toLocaleString('it-IT')}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="arena-card overflow-hidden">
          <Table className="table-fixed">
            <TableHeader className="bg-slate-50">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-[34%] font-bold text-slate-500 md:w-[30%]">Asset</TableHead>
                <TableHead className="hidden w-[15%] font-bold text-slate-500 lg:table-cell">Categoria</TableHead>
                <TableHead className="hidden w-[16%] font-bold text-slate-500 xl:table-cell">Localizzazione</TableHead>
                <TableHead className="hidden w-[12%] font-bold text-slate-500 2xl:table-cell">Ultima verifica</TableHead>
                <TableHead className="w-[20%] font-bold text-slate-500 md:w-[16%]">Prossima</TableHead>
                <TableHead className="w-[20%] font-bold text-slate-500 md:w-[18%]">Stato</TableHead>
                <TableHead className="w-[86px] pr-4 text-right font-bold text-slate-500">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-16 text-slate-400 font-medium">Nessun asset trovato</TableCell></TableRow>
              )}
              {filtered.map((asset) => {
                const nextDate = getNextVerificationDate(asset.last_verification, asset.verification_frequency_days);
                const parsedAssetSerial = parseAssetSerial(asset.serial_number);
                const locationName =
                  locationsById.get(asset.location_id)?.name ??
                  (asset as { location?: { name?: string | null } }).location?.name ??
                  parsedAssetSerial?.locationCode ??
                  null;
                const locationLabel = formatLocationDisplayName(locationName);
                const dueLabel = formatDueLabel(nextDate);
                return (
                  <TableRow key={asset.id} className={cn('group border-l-2 border-slate-100 transition-colors hover:bg-slate-50/70', getStatusAccent(asset.status))}>
                    <TableCell className="min-w-0 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <AssetCategoryIcon category={asset.category} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900">{asset.name}</p>
                          <p className="truncate text-xs font-medium text-slate-400">
                            {[asset.brand, asset.model, asset.serial_number].filter(Boolean).join(' · ')}
                          </p>
                          <p className="mt-1 truncate text-xs font-medium text-slate-500 lg:hidden">
                            {asset.category}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden min-w-0 lg:table-cell">
                      <p className="truncate text-sm font-medium text-slate-600">{asset.category}</p>
                    </TableCell>
                    <TableCell className="hidden min-w-0 xl:table-cell">
                      <div className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-slate-600">
                        <MapPin size={13} className="text-slate-400" />
                        <span className="truncate">{locationLabel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-slate-500 2xl:table-cell">
                      {asset.last_verification ? format(new Date(asset.last_verification), 'dd MMM yyyy', { locale: it }) : '—'}
                    </TableCell>
                    <TableCell className="min-w-0">
                      <div className="space-y-1">
                        <p className="truncate text-sm font-semibold text-slate-700">
                          {nextDate ? format(nextDate, 'dd MMM yyyy', { locale: it }) : '—'}
                        </p>
                        <p className={cn('text-xs font-semibold', asset.status === 'SCADUTO' ? 'text-red-500' : asset.status === 'IN SCADENZA' ? 'text-amber-600' : 'text-slate-400')}>
                          {dueLabel}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-0"><StatusBadge status={asset.status} /></TableCell>
                    <TableCell className="pr-3">
                      <div className="flex justify-end gap-0.5 text-slate-400">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5" onClick={() => setDetailAsset(asset)}>
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="hidden h-9 w-9 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 md:inline-flex" onClick={() => openEdit(asset)}>
                          <Edit size={16} />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl p-2 border-slate-100 shadow-xl">
                            <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer font-medium" onClick={() => openEdit(asset)}><Edit size={16} /> Modifica</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer font-medium text-red-600 focus:text-red-700 focus:bg-red-50" onClick={() => handleDelete(asset.id, asset.name)}><Trash2 size={16} /> Elimina</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[min(94vw,34rem)] rounded-xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifica Asset' : 'Nuovo Asset'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>Nome *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Es. Centrale Antincendio" className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label>Categoria *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as AssetCategory })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                  <SelectContent className="rounded-xl">{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div
                key={modalOpen ? `${editing?.id ?? 'new'}-${locations.length}` : 'closed'}
                className="space-y-1"
              >
                <Label>Ubicazione</Label>
                <Select 
                  // Se le location arrivano mentre il modal e aperto, il wrapper keyed
                  // forza il remount del Select e l'etichetta selezionata si riallinea.
                  value={form.location_id} 
                  onValueChange={(v) => setForm({ ...form, location_id: v })}
                >
                  <SelectTrigger className="w-full min-w-0 rounded-xl">
                    <span className="truncate text-left">
                      {selectedLocationLabel || 'Seleziona...'}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {locationOptions.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Marca</Label>
                <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Es. Siemens" className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label>Modello</Label>
                <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Es. FC722" className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label>Numero seriale</Label>
                <Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value.toUpperCase() })} placeholder="CAS-UF5-001" className="rounded-xl" />
                {parsedSerial ? (
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <p><span className="font-semibold text-slate-800">Sigla apparato:</span> {parsedSerial.equipmentCode}</p>
                    <p><span className="font-semibold text-slate-800">Codice ubicazione:</span> {parsedSerial.locationCode}</p>
                    <p><span className="font-semibold text-slate-800">Progressivo:</span> {parsedSerial.progressiveCode}</p>
                    {selectedLocation && (
                      <p className={cn('mt-1 font-medium', serialMatchesLocation ? 'text-emerald-600' : 'text-amber-600')}>
                        {serialMatchesLocation
                          ? 'Seriale e ubicazione sono coerenti.'
                          : `Il seriale punta a ${parsedSerial.locationCode}, ma l'ubicazione selezionata e ${selectedLocation.name}.`}
                      </p>
                    )}
                  </div>
                ) : form.serial_number ? (
                  <p className="text-xs text-amber-600">Usa il formato `SIGLA-LOC-PROG`, ad esempio `CAS-UF5-001`.</p>
                ) : null}
              </div>
              <div className="space-y-1">
                <Label>Frequenza verifica (giorni)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.verification_frequency_days}
                  onChange={(e) => {
                    const days = Number(e.target.value);
                    setForm({
                      ...form,
                      verification_frequency_days: days,
                      verification_frequency_months: Math.max(1, Math.round(days / 30)),
                    });
                  }}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label>Data installazione</Label>
                <Input type="date" value={form.installation_date} onChange={(e) => setForm({ ...form, installation_date: e.target.value })} className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label>Ultima verifica</Label>
                <Input type="date" value={form.last_verification} onChange={(e) => setForm({ ...form, last_verification: e.target.value })} className="rounded-xl" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setModalOpen(false)}>Annulla</Button>
            <AnimatedSaveButton onClick={handleSave} isSaving={saving} idleLabel="Salva" />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={!!detailAsset} onOpenChange={() => setDetailAsset(null)}>
        <DialogContent className="rounded-xl max-w-md">
          <DialogHeader><DialogTitle>Dettaglio Asset</DialogTitle></DialogHeader>
          {detailAsset && (
            <div className="space-y-3 text-sm">
              {[
                ['Nome', detailAsset.name],
                ['Categoria', detailAsset.category],
                ['Marca / Modello', `${detailAsset.brand ?? '—'} ${detailAsset.model ?? ''}`],
                ['Seriale', detailAsset.serial_number ?? '—'],
                [
                  'Ubicazione',
                  formatLocationDisplayName(
                    locationsById.get(detailAsset.location_id)?.name ??
                    parseAssetSerial(detailAsset.serial_number)?.locationCode ??
                    null
                  ),
                ],
                ['Stato', detailAsset.status],
                ['Ultima verifica', detailAsset.last_verification ? format(new Date(detailAsset.last_verification), 'd MMM yyyy', { locale: it }) : '—'],
                ['Frequenza', `${detailAsset.verification_frequency_days} giorni`],
                ['Installazione', detailAsset.installation_date ? format(new Date(detailAsset.installation_date), 'd MMM yyyy', { locale: it }) : '—'],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="text-slate-500 font-medium">{label}</span>
                  <span className="font-bold text-slate-800">{value}</span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDetailAsset(null)}>Chiudi</Button>
            <Button className="rounded-xl bg-primary" onClick={() => { if (detailAsset) { setDetailAsset(null); openEdit(detailAsset); } }}>Modifica</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
