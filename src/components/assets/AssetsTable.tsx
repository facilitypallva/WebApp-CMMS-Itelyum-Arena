import React, { useEffect, useState, useMemo } from 'react';
import { Filter, Plus, MoreHorizontal, Eye, Edit, Trash2, MapPin, QrCode, Search, Download, BellRing, Flame, Cog, Zap, Camera, RotateCcw, Boxes, ChevronRight, Save, X, AlertCircle, AlertTriangle } from 'lucide-react';
import { Badge, Button, Card, Input, EmptyState, ErrorState, SavingIndicator } from '@/components/ui-v2';
import { AnimatedSaveButton } from '@/components/ui/animated-save-button';
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
import { waitForSaveFeedback, waitForSaveSuccessFeedback } from '@/lib/saveFeedback';
import { differenceInDays, format } from 'date-fns';
import { it } from 'date-fns/locale';
import { assetStatusConfig, formatRelativeDate, formatDate } from '@/lib/ui-helpers';

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

const CATEGORY_UI: Record<AssetCategory, { icon: React.ElementType; color: string; bgColor: string }> = {
  'Rivelazione incendi': { icon: BellRing, color: '#A8531A', bgColor: '#FFF3E8' },
  'Antincendio': { icon: Flame, color: '#A83228', bgColor: '#FFF0EE' },
  'Meccanico': { icon: Cog, color: '#5F5E5A', bgColor: '#F1EFE8' },
  'Elettrico': { icon: Zap, color: '#A8531A', bgColor: '#FFF3E8' },
  'TVCC': { icon: Camera, color: '#5F5E5A', bgColor: '#F1EFE8' },
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
  const config = assetStatusConfig[status];
  return (
    <Badge 
      variant={config.variant} 
      dot={config.dot}
      className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
    >
      {config.label}
    </Badge>
  );
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

function formatExportDate(value: string | null | undefined, withTime = false) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return format(date, withTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy', { locale: it });
}

function escapeExcelCell(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
    const saveStartedAt = Date.now();

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
      await waitForSaveFeedback(saveStartedAt);
      setSaving(false);
      await waitForSaveSuccessFeedback();
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

  const handleExportAssets = () => {
    if (filtered.length === 0) {
      toast.info('Nessun asset da esportare');
      return;
    }

    const headers = [
      'ID',
      'Nome',
      'Categoria',
      'Marca',
      'Modello',
      'Numero seriale',
      'Sigla apparato',
      'Codice ubicazione seriale',
      'Progressivo seriale',
      'Ubicazione',
      'Codice ubicazione',
      'ID ubicazione',
      'Stato',
      'Stato forzato',
      'Data installazione',
      'Ultima verifica',
      'Prossima verifica',
      'Scadenza',
      'Frequenza codice',
      'Frequenza giorni',
      'Frequenza mesi',
      'Documenti',
      'Creato il',
      'Aggiornato il',
    ];

    const rows = filtered.map((asset) => {
      const parsedAssetSerial = parseAssetSerial(asset.serial_number);
      const rawLocationName =
        locationsById.get(asset.location_id)?.name ??
        (asset as { location?: { name?: string | null } }).location?.name ??
        parsedAssetSerial?.locationCode ??
        '';
      const locationCode = rawLocationName.replace(/^00_/, '').toUpperCase();
      const nextDate = getNextVerificationDate(asset.last_verification, asset.verification_frequency_days);

      return [
        asset.id,
        asset.name,
        asset.category,
        asset.brand ?? '',
        asset.model ?? '',
        asset.serial_number ?? '',
        parsedAssetSerial?.equipmentCode ?? '',
        parsedAssetSerial?.locationCode ?? '',
        parsedAssetSerial?.progressiveCode ?? '',
        formatLocationDisplayName(rawLocationName),
        locationCode,
        asset.location_id ?? '',
        asset.status,
        asset.status_override ?? '',
        formatExportDate(asset.installation_date),
        formatExportDate(asset.last_verification),
        nextDate ? format(nextDate, 'dd/MM/yyyy', { locale: it }) : '',
        formatDueLabel(nextDate),
        asset.verification_frequency_code ?? '',
        asset.verification_frequency_days,
        asset.verification_frequency_months,
        (asset.documents ?? []).join(' | '),
        formatExportDate(asset.created_at, true),
        formatExportDate(asset.updated_at, true),
      ];
    });

    const tableRows = [headers, ...rows]
      .map((row) => `<tr>${row.map((cell) => `<td>${escapeExcelCell(cell)}</td>`).join('')}</tr>`)
      .join('');
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
      th, td { border: 1px solid #d6dce5; padding: 6px 8px; vertical-align: top; }
      tr:first-child td { background: #eef2f7; font-weight: 700; }
    </style>
  </head>
  <body>
    <table>${tableRows}</table>
  </body>
</html>`;

    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asset-${format(new Date(), 'yyyy-MM-dd')}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length.toLocaleString('it-IT')} asset esportati`);
  };

  return (
    <div className="space-y-7">
      {/* Header Pagina */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <nav className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-[#5F5E5A]">
            <span>Anagrafiche</span>
            <span className="text-[#888780]">/</span>
            <span className="font-bold text-[#1C1B18]">Asset</span>
          </nav>
          <h2 className="text-2xl font-bold tracking-tight text-[#1C1B18]">Asset</h2>
          <p className="mt-1 text-[14px] font-medium text-[#5F5E5A]">
            {assets.length.toLocaleString('it-IT')} asset monitorati · {CATEGORIES.length} categorie · {assets.filter(a => a.status === 'SCADUTO').length} scaduti
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            leadingIcon={<Download size={16} />}
            onClick={handleExportAssets}
          >
            Esporta Excel
          </Button>
          <Button
            variant="secondary"
            leadingIcon={<QrCode size={16} />}
            onClick={() => toast.info('Scanner QR non configurato in locale')}
          >
            Scansiona QR
          </Button>
          <Button 
            variant="primary" 
            leadingIcon={<Plus size={18} />} 
            onClick={openCreate}
          >
            Nuovo asset
          </Button>
        </div>
      </div>

      {/* Toolbar Filtri */}
      <Card className="p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Input
            value={localSearch}
            onChange={(event) => setLocalSearch(event.target.value)}
            placeholder="Cerca asset, marca, codice..."
            className="max-w-md"
            startContent={<Search size={16} className="text-[#888780]" />}
          />
          <Select value={filterCategory} onValueChange={(value) => setFilterCategory(value as AssetCategory | 'ALL')}>
            <SelectTrigger className="w-full lg:w-48">
              <span className="truncate text-left">{getCategoryFilterLabel(filterCategory)}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tutte le categorie</SelectItem>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className="w-full lg:w-56">
              <span className="truncate text-left">{getLocationFilterLabel(filterLocation)}</span>
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="ALL">Tutte le ubicazioni</SelectItem>
              {LOCATION_CODES.map((code) => (
                <SelectItem key={code} value={code}>{formatLocationDisplayName(code)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as AssetStatus | 'ALL')}>
            <SelectTrigger className="w-full lg:w-44">
              <span className="truncate text-left">{getStatusFilterLabel(filterStatus)}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Stato · Tutti</SelectItem>
              <SelectItem value="IN REGOLA">In Regola</SelectItem>
              <SelectItem value="IN SCADENZA">In Scadenza</SelectItem>
              <SelectItem value="SCADUTO">Scaduto</SelectItem>
              <SelectItem value="IN LAVORAZIONE">In Lavorazione</SelectItem>
            </SelectContent>
          </Select>
          <div className="shrink-0 whitespace-nowrap text-[13px] font-bold text-[#888780] lg:ml-auto">
            1-{filtered.length.toLocaleString('it-IT')} di {assets.length.toLocaleString('it-IT')}
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 w-full animate-pulse rounded-lg border border-[#E5E4DF] bg-white" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[#E5E4DF] bg-white shadow-none overflow-hidden">
          <Table className="table-fixed">
            <TableHeader className="bg-[#FAFAF9]">
              <TableRow className="border-b border-[#E5E4DF] hover:bg-transparent">
                <TableHead className="w-[34%] text-[11px] font-bold uppercase tracking-wider text-[#888780] md:w-[30%]">Asset</TableHead>
                <TableHead className="hidden w-[15%] text-[11px] font-bold uppercase tracking-wider text-[#888780] lg:table-cell">Categoria</TableHead>
                <TableHead className="hidden w-[16%] text-[11px] font-bold uppercase tracking-wider text-[#888780] xl:table-cell">Ubicazione</TableHead>
                <TableHead className="hidden w-[12%] text-[11px] font-bold uppercase tracking-wider text-[#888780] 2xl:table-cell">Ultima verifica</TableHead>
                <TableHead className="w-[20%] text-[11px] font-bold uppercase tracking-wider text-[#888780] md:w-[16%]">Prossima</TableHead>
                <TableHead className="w-[20%] text-[11px] font-bold uppercase tracking-wider text-[#888780] md:w-[18%] text-center">Stato</TableHead>
                <TableHead className="w-[86px] pr-4 text-right text-[11px] font-bold uppercase tracking-wider text-[#888780]">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-20">
                  <EmptyState 
                    title="Nessun asset trovato" 
                    description="I filtri applicati non hanno restituito risultati." 
                  />
                </TableCell></TableRow>
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
                const categoryStyle = CATEGORY_UI[asset.category] || CATEGORY_UI['Meccanico'];
                const CategoryIcon = categoryStyle.icon;

                return (
                  <TableRow 
                    key={asset.id} 
                    className="h-[64px] border-b border-[#E5E4DF] bg-white transition-colors hover:bg-[#FAFAF9] group cursor-pointer"
                    onClick={() => setDetailAsset(asset)}
                  >
                    <TableCell className="min-w-0">
                      <div className="flex min-w-0 items-center gap-3">
                        <div 
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                          style={{ backgroundColor: categoryStyle.bgColor, color: categoryStyle.color }}
                        >
                          <CategoryIcon size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-bold text-[#1C1B18]">{asset.name}</p>
                          <p className="truncate text-[12px] font-medium text-[#888780] tabular-nums">
                            {[asset.brand, asset.model, asset.serial_number].filter(Boolean).join(' · ')}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <p className="truncate text-[13px] font-semibold text-[#1C1B18]">{asset.category}</p>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#5F5E5A]">
                        <MapPin size={13} className="text-[#888780]" />
                        <span className="truncate">{locationLabel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden 2xl:table-cell">
                      <span className="text-[13px] font-medium text-[#5F5E5A] tabular-nums">
                        {asset.last_verification ? format(new Date(asset.last_verification), 'dd MMM yyyy', { locale: it }) : '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="truncate text-[13px] font-bold text-[#1C1B18] tabular-nums">
                          {nextDate ? format(nextDate, 'dd MMM yyyy', { locale: it }) : '—'}
                        </p>
                        <p className={cn('text-[11px] font-bold uppercase', asset.status === 'SCADUTO' ? 'text-[#A83228]' : asset.status === 'IN SCADENZA' ? 'text-[#A8531A]' : 'text-[#888780]')}>
                          {dueLabel}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={asset.status} />
                    </TableCell>
                    <TableCell className="pr-3">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailAsset(asset)}>
                          <Eye size={15} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(asset)}>
                          <Edit size={15} />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal size={15} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-44 p-1.5">
                            <DropdownMenuItem className="gap-2 font-semibold" onClick={() => openEdit(asset)}><Edit size={14} /> Modifica</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-2 font-semibold text-[#A83228] focus:bg-[#FFF0EE] focus:text-[#A83228]" onClick={() => handleDelete(asset.id, asset.name)}><Trash2 size={14} /> Elimina</DropdownMenuItem>
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
        <DialogContent className="w-[min(92vw,920px)] max-w-none sm:max-w-none p-0 overflow-hidden">
          <DialogHeader className="border-b border-[#E5E4DF] bg-white px-6 py-4">
            <DialogTitle className="text-lg font-bold text-[#1C1B18]">
              {editing ? 'Modifica Asset' : 'Nuovo Asset'}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[68vh] overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-2 space-y-3">
                <div className="flex items-center gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#888780]">Identità Asset</p>
                  <div className="h-px flex-1 bg-[#F1EFE8]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-bold text-[#1C1B18]">Nome *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Es. Centrale Antincendio" className="bg-white" />
                </div>
              </div>

              <div className="col-span-2 flex items-center gap-3 mt-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#888780]">Classificazione</p>
                <div className="h-px flex-1 bg-[#F1EFE8]" />
              </div>

              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-[#1C1B18]">Categoria *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as AssetCategory })}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-[#1C1B18]">Ubicazione *</Label>
                <Select value={form.location_id} onValueChange={(v) => setForm({ ...form, location_id: v })}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                  <SelectContent className="max-h-60">{locationOptions.map((l) => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="col-span-2 flex items-center gap-3 mt-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#888780]">Dettagli Tecnici</p>
                <div className="h-px flex-1 bg-[#F1EFE8]" />
              </div>

              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-[#1C1B18]">Marca</Label>
                <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Es. Siemens" className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-[#1C1B18]">Modello</Label>
                <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Es. FC722" className="bg-white" />
              </div>
              <div className="col-span-2 space-y-3">
                <Label className="text-[13px] font-bold text-[#1C1B18]">Numero seriale</Label>
                <Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value.toUpperCase() })} placeholder="CAS-UF5-001" className="bg-white" />
                {parsedSerial ? (
                  <div className="rounded-lg border border-[#E5E4DF] bg-[#FAFAF9] p-3 text-[12px] text-[#5F5E5A]">
                    <div className="flex gap-4">
                      <p><span className="font-bold text-[#1C1B18]">Apparato:</span> {parsedSerial.equipmentCode}</p>
                      <p><span className="font-bold text-[#1C1B18]">LOC:</span> {parsedSerial.locationCode}</p>
                      <p><span className="font-bold text-[#1C1B18]">Prog:</span> {parsedSerial.progressiveCode}</p>
                    </div>
                    {selectedLocation && <p className={cn('mt-1.5 font-bold', serialMatchesLocation ? 'text-[#1A7A3C]' : 'text-[#A8531A]')}>
                      {serialMatchesLocation ? '● Seriale e ubicazione coerenti.' : `● Il seriale punta a ${parsedSerial.locationCode}, ubicazione selezionata: ${selectedLocation.name}.`}
                    </p>}
                  </div>
                ) : form.serial_number && <p className="text-[12px] font-medium text-[#A8531A]">Formato consigliato: `SIGLA-LOC-000`</p>}
              </div>

              <div className="col-span-2 flex items-center gap-3 mt-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#888780]">Date e Scadenze</p>
                <div className="h-px flex-1 bg-[#F1EFE8]" />
              </div>

              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-[#1C1B18]">Frequenza (giorni)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.verification_frequency_days}
                  onChange={(e) => setForm({ ...form, verification_frequency_days: Number(e.target.value), verification_frequency_months: Math.max(1, Math.round(Number(e.target.value) / 30)) })}
                  className="bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-[#1C1B18]">Installazione</Label>
                <Input type="date" value={form.installation_date} onChange={(e) => setForm({ ...form, installation_date: e.target.value })} className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-bold text-[#1C1B18]">Ultima verifica</Label>
                <Input type="date" value={form.last_verification} onChange={(e) => setForm({ ...form, last_verification: e.target.value })} className="bg-white" />
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-[#E5E4DF] bg-[#FAFAF9] px-8 py-5 justify-end gap-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Annulla</Button>
            <AnimatedSaveButton onClick={handleSave} isSaving={saving} idleLabel={editing ? "Salva modifiche" : "Crea asset"} />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={!!detailAsset} onOpenChange={() => setDetailAsset(null)}>
        <DialogContent className="w-[min(92vw,900px)] max-w-none sm:max-w-none p-0 overflow-hidden">
          <DialogHeader className="border-b border-[#E5E4DF] bg-white px-6 py-4">
            <div className="flex items-center gap-3">
              <div 
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ 
                  backgroundColor: detailAsset ? (CATEGORY_UI[detailAsset.category]?.bgColor || '#F1EFE8') : '#F1EFE8', 
                  color: detailAsset ? (CATEGORY_UI[detailAsset.category]?.color || '#5F5E5A') : '#5F5E5A' 
                }}
              >
                {detailAsset && React.createElement(CATEGORY_UI[detailAsset.category]?.icon || Cog, { size: 16 })}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.10em] text-[#888780]">Scheda Asset</p>
                  {detailAsset && <StatusBadge status={detailAsset.status} />}
                </div>
                <DialogTitle className="text-lg font-bold text-[#1C1B18]">{detailAsset?.name}</DialogTitle>
              </div>
            </div>
          </DialogHeader>
          
          {detailAsset && (
            <div className="px-6 py-6 space-y-6">
              <div className="rounded-xl border border-[#E5E4DF] bg-[#FAFAF9] p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#888780]">Seriale</p>
                    <p className="text-lg font-bold text-[#1C1B18]">{detailAsset.serial_number || '—'}</p>
                  </div>
                  <div className="md:text-right">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#888780]">Ubicazione</p>
                    <p className="text-lg font-bold text-[#1C1B18]">
                      {formatLocationDisplayName(locationsById.get(detailAsset.location_id)?.name ?? parseAssetSerial(detailAsset.serial_number)?.locationCode)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
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
                ['Frequenza verifica', `${detailAsset.verification_frequency_days} giorni`],
                ['Installazione', detailAsset.installation_date ? format(new Date(detailAsset.installation_date), 'd MMM yyyy', { locale: it }) : '—'],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between border-b border-[#F1EFE8] py-3">
                  <span className="text-[13px] font-medium text-[#5F5E5A]">{label}</span>
                  <span className="text-[13px] font-bold text-[#1C1B18]">{value}</span>
                </div>
              ))}
              </div>
            </div>
          )}
          <DialogFooter className="border-t border-[#E5E4DF] bg-[#FAFAF9] px-8 py-5 justify-end gap-3">
            <Button variant="secondary" onClick={() => setDetailAsset(null)}>Chiudi</Button>
            <Button variant="primary" onClick={() => { if (detailAsset) { setDetailAsset(null); openEdit(detailAsset); } }}>Modifica</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
