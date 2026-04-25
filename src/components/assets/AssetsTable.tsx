import React, { useEffect, useState, useMemo } from 'react';
import { Filter, Plus, MoreHorizontal, Eye, Edit, Trash2, MapPin, Layers3, Rows3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Asset, AssetCategory, AssetStatus } from '@/types';
import { cn } from '@/lib/utils';
import { useAssets } from '@/hooks/useAssets';
import { useLocations } from '@/hooks/useLocations';
import { AssetCategoryIcon } from '@/components/assets/AssetCategoryIcon';
import { toast } from 'sonner';
import { getNextVerificationDate, parseAssetSerial } from '@/lib/assetUtils';
import { format } from 'date-fns';
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
    status === 'IN REGOLA' ? 'bg-emerald-500' :
    status === 'IN SCADENZA' ? 'bg-orange-500' :
    status === 'IN LAVORAZIONE' ? 'bg-blue-500' :
    'bg-red-500';
  return <Badge className={cn(cls, 'text-white border-none rounded-md px-2.5 py-0.5 font-bold text-[10px]')}>{status}</Badge>;
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
  const [filterStatus, setFilterStatus] = useState<AssetStatus | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState<AssetCategory | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'GROUPED'>('TABLE');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);

  const filtered = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    return assets.filter((a) => {
      const matchSearch = !q || a.name.toLowerCase().includes(q) ||
        a.serial_number?.toLowerCase().includes(q) ||
        a.model?.toLowerCase().includes(q);
      const matchStatus = filterStatus === 'ALL' || a.status === filterStatus;
      const matchCategory = filterCategory === 'ALL' || a.category === filterCategory;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [assets, globalSearch, filterStatus, filterCategory]);

  const categoryCounts = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        category,
        count: assets.filter((asset) => asset.category === category).length,
      })),
    [assets]
  );

  const groupedAssets = useMemo(() => {
    const groups = new Map<AssetCategory, Asset[]>();

    CATEGORIES.forEach((category) => groups.set(category, []));
    filtered.forEach((asset) => {
      groups.get(asset.category)?.push(asset);
    });

    return CATEGORIES
      .map((category) => ({
        category,
        items: groups.get(category) ?? [],
      }))
      .filter((group) => group.items.length > 0);
  }, [filtered]);

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
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[auto_auto_minmax(0,1fr)_auto] xl:items-end">
        <div className="self-end">
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as AssetStatus | 'ALL')}>
            <SelectTrigger className="h-11 w-44 rounded-xl border-none bg-white shadow-sm">
              <Filter size={16} className="mr-2 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL">Tutti gli stati</SelectItem>
              <SelectItem value="IN REGOLA">In Regola</SelectItem>
              <SelectItem value="IN SCADENZA">In Scadenza</SelectItem>
              <SelectItem value="SCADUTO">Scaduto</SelectItem>
              <SelectItem value="IN LAVORAZIONE">In Lavorazione</SelectItem>
            </SelectContent>
          </Select>

        </div>

        <div className="self-end">
          <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <Button
              type="button"
              variant="ghost"
              className={cn('h-9 rounded-xl px-4', viewMode === 'TABLE' && 'bg-slate-900 text-white hover:bg-slate-900 hover:text-white')}
              onClick={() => setViewMode('TABLE')}
            >
              <Rows3 size={16} />
              Tabella
            </Button>
            <Button
              type="button"
              variant="ghost"
              className={cn('h-9 rounded-xl px-4', viewMode === 'GROUPED' && 'bg-slate-900 text-white hover:bg-slate-900 hover:text-white')}
              onClick={() => setViewMode('GROUPED')}
            >
              <Layers3 size={16} />
              Per categoria
            </Button>
          </div>
        </div>

        <div className="min-w-0 self-end">
          <div className="scrollbar-hide flex h-11 items-center gap-2 overflow-x-auto">
            <Tooltip>
              <TooltipTrigger
                type="button"
                className={cn(
                  'relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm transition-colors',
                  filterCategory === 'ALL'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                )}
                onClick={() => setFilterCategory('ALL')}
              >
                <Layers3 size={16} />
              </TooltipTrigger>
              <TooltipContent>Tutte le categorie</TooltipContent>
            </Tooltip>
            {categoryCounts.map(({ category, count }) => (
              <div key={category}>
                <Tooltip>
                <TooltipTrigger
                  type="button"
                  className={cn(
                    'relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm transition-colors',
                    filterCategory === category
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  )}
                  onClick={() => setFilterCategory(category)}
                >
                  <AssetCategoryIcon category={category} />
                  <span
                    className={cn(
                      'absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none',
                      filterCategory === category
                        ? 'bg-white text-slate-900'
                        : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {count}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{category}</TooltipContent>
                </Tooltip>
              </div>
            ))}
            <div className="ml-2 shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-sm">
              {filterCategory === 'ALL' ? 'Tutte le categorie' : filterCategory}
            </div>
          </div>
        </div>

        <div className="self-end justify-self-start xl:justify-self-end">
          <Button className="h-11 rounded-xl bg-primary px-6 font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 gap-2" onClick={openCreate}>
            <Plus size={18} /> Nuovo Asset
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : viewMode === 'GROUPED' ? (
        <div className="space-y-5">
          {groupedAssets.length === 0 && (
            <div className="rounded-[2rem] border border-slate-100 bg-white py-16 text-center font-medium text-slate-400 shadow-sm">
              Nessun asset trovato
            </div>
          )}
          {groupedAssets.map((group) => (
            <div key={group.category} className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-8 py-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                    <AssetCategoryIcon category={group.category} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{group.category}</h3>
                    <p className="text-sm text-slate-500">
                      {group.items.length} {group.items.length === 1 ? 'asset' : 'asset'} in questa categoria
                    </p>
                  </div>
                </div>
                <Badge className="w-fit rounded-full border-none bg-slate-900 px-3 py-1 text-white">
                  {group.items.length}
                </Badge>
              </div>

              <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map((asset) => {
                  const nextDate = getNextVerificationDate(asset.last_verification, asset.verification_frequency_days);
                  const parsedAssetSerial = parseAssetSerial(asset.serial_number);
                  const locationName =
                    locationsById.get(asset.location_id)?.name ??
                    (asset as { location?: { name?: string | null } }).location?.name ??
                    parsedAssetSerial?.locationCode ??
                    null;
                  const locationLabel = formatLocationDisplayName(locationName);

                  return (
                    <div key={asset.id} className="group rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-5 transition-colors hover:border-slate-300 hover:bg-white">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
                              <AssetCategoryIcon category={asset.category} />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-800">{asset.name}</p>
                              <p className="truncate text-xs font-medium text-slate-400">
                                {asset.brand} {asset.model} {asset.serial_number ? `• ${asset.serial_number}` : ''}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-slate-400 hover:bg-primary/5 hover:text-primary" onClick={() => setDetailAsset(asset)}>
                            <Eye size={18} />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex">
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-slate-400 hover:bg-primary/5 hover:text-primary">
                                <MoreHorizontal size={18} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl border-slate-100 p-2 shadow-xl">
                              <DropdownMenuItem className="cursor-pointer gap-2 rounded-lg font-medium" onClick={() => openEdit(asset)}>
                                <Edit size={16} /> Modifica
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="cursor-pointer gap-2 rounded-lg font-medium text-red-600 focus:bg-red-50 focus:text-red-700" onClick={() => handleDelete(asset.id, asset.name)}>
                                <Trash2 size={16} /> Elimina
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <StatusBadge status={asset.status} />
                        <div className="flex w-fit items-center gap-1.5 rounded-lg bg-white px-2 py-1 shadow-sm">
                          <MapPin size={12} className="text-slate-400" />
                          <span className="text-xs font-bold text-slate-500">{locationLabel}</span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 rounded-2xl bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-slate-500">Prossima verifica</span>
                          <span className="font-bold text-slate-700">
                            {nextDate ? format(nextDate, 'd MMM yyyy', { locale: it }) : '—'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-slate-500">Frequenza</span>
                          <span className="font-bold text-slate-700">Ogni {asset.verification_frequency_days} giorni</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-100">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="font-bold text-slate-500 py-6 pl-8">ASSET</TableHead>
                <TableHead className="font-bold text-slate-500">CATEGORIA</TableHead>
                <TableHead className="font-bold text-slate-500">STATO</TableHead>
                <TableHead className="font-bold text-slate-500">PROSSIMA VERIFICA</TableHead>
                <TableHead className="font-bold text-slate-500">UBICAZIONE</TableHead>
                <TableHead className="text-right pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-16 text-slate-400 font-medium">Nessun asset trovato</TableCell></TableRow>
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
                return (
                  <TableRow key={asset.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="pl-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <AssetCategoryIcon category={asset.category} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{asset.name}</p>
                          <p className="text-xs text-slate-400 font-medium">{asset.brand} {asset.model} {asset.serial_number ? `• ${asset.serial_number}` : ''}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><p className="text-sm font-semibold text-slate-600">{asset.category}</p></TableCell>
                    <TableCell><StatusBadge status={asset.status} /></TableCell>
                    <TableCell>
                      <p className="text-sm font-bold text-slate-700">
                        {nextDate ? format(nextDate, 'd MMM yyyy', { locale: it }) : '—'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ogni {asset.verification_frequency_days} giorni</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 p-1 px-2 rounded-lg bg-slate-100/50 w-fit">
                        <MapPin size={12} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-500">{locationLabel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5" onClick={() => setDetailAsset(asset)}>
                          <Eye size={18} />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5">
                              <MoreHorizontal size={18} />
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
        <DialogContent className="rounded-3xl max-w-lg">
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
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Seleziona..." />
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
            <Button className="rounded-xl bg-primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvataggio...' : 'Salva'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={!!detailAsset} onOpenChange={() => setDetailAsset(null)}>
        <DialogContent className="rounded-3xl max-w-md">
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
