import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle, Clock, CheckCircle2, Wrench, Hammer, MapPin, FolderOpen, CalendarDays, GripVertical, Truck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAssets } from '@/hooks/useAssets';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import { useTechnicians } from '@/hooks/useTechnicians';
import { useSuppliers } from '@/hooks/useSuppliers';
import { PRIORITY_LABELS, TECHNICIAN_EMPLOYMENT_LABELS } from '@/lib/constants';
import { parseAssetSerial } from '@/lib/assetUtils';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isToday, differenceInDays,
} from 'date-fns';
import { it } from 'date-fns/locale';
import { Asset, Priority, WorkOrderType } from '@/types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface CalendarEvent {
  asset: Asset;
  daysFromToday: number;
  dayKey?: string;
  workOrderId?: string | null;
  workOrderCode?: string | null;
  visualStatus?: 'DUE' | 'PLANNED' | 'IN_PROGRESS';
}

function getOccurrencesInRange(
  lastVerification: string,
  frequencyDays: number,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  if (frequencyDays <= 0) return [];
  const base = new Date(lastVerification);
  const daysDiff = differenceInDays(rangeStart, base);
  const startN = Math.max(1, Math.ceil(daysDiff / frequencyDays));
  const results: Date[] = [];
  let n = startN;
  while (true) {
    const date = addDays(base, n * frequencyDays);
    if (date > rangeEnd) break;
    results.push(date);
    n++;
  }
  return results;
}

function eventColor(daysFromToday: number): string {
  if (daysFromToday < 0) return 'bg-red-100 text-red-700';
  if (daysFromToday <= 30) return 'bg-orange-100 text-orange-700';
  return 'bg-emerald-100 text-emerald-700';
}

function dotColor(daysFromToday: number): string {
  if (daysFromToday < 0) return 'bg-red-400';
  if (daysFromToday <= 30) return 'bg-orange-400';
  return 'bg-emerald-400';
}

const DOW_LABELS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const TYPES: WorkOrderType[] = ['PROGRAMMED', 'CORRECTIVE', 'EXTRA'];
const TYPE_LABELS: Record<WorkOrderType, string> = {
  PROGRAMMED: 'Programmato',
  CORRECTIVE: 'Correttivo',
  EXTRA: 'Extra',
};

const ACTIVE_WORK_ORDER_STATUSES = new Set(['NEW', 'PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'SUSPENDED']);
const NO_SUPPLIER_VALUE = '__none__';
const ALL_SUPPLIERS_VALUE = '__all__';

interface WoFormState {
  description: string;
  type: WorkOrderType;
  priority: Priority;
  planned_date: string;
  technician_id: string;
  supplier_id: string;
  notes: string;
}

export function ScheduleView() {
  const { assets, loading, updateAsset } = useAssets();
  const { createWorkOrder, updateWorkOrder, workOrders } = useWorkOrders();
  const { technicians } = useTechnicians();
  const { suppliers } = useSuppliers();
  const navigate = useNavigate();

  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [planningViaDrag, setPlanningViaDrag] = useState(false);
  const [planningEvent, setPlanningEvent] = useState<CalendarEvent | null>(null);

  // WO creation modal
  const [woModalOpen, setWoModalOpen] = useState(false);
  const [woAsset, setWoAsset] = useState<Asset | null>(null);
  const [woForm, setWoForm] = useState<WoFormState>({
    description: '',
    type: 'PROGRAMMED',
    priority: 'MEDIUM',
    planned_date: '',
    technician_id: '',
    supplier_id: '',
    notes: '',
  });
  const [woSaving, setWoSaving] = useState(false);
  const [planningModalOpen, setPlanningModalOpen] = useState(false);
  const [planningTargetDay, setPlanningTargetDay] = useState<string | null>(null);
  const [planningSupplierId, setPlanningSupplierId] = useState('');
  const [supplierFilter, setSupplierFilter] = useState(ALL_SUPPLIERS_VALUE);
  const [editingSupplierWorkOrderId, setEditingSupplierWorkOrderId] = useState<string | null>(null);
  const [editingSupplierValue, setEditingSupplierValue] = useState(NO_SUPPLIER_VALUE);
  const [savingSupplierChange, setSavingSupplierChange] = useState(false);

  const selectedTechnician = technicians.find((t) => t.id === woForm.technician_id) ?? null;
  const selectedPlanningSupplier = suppliers.find((supplier) => supplier.id === planningSupplierId) ?? null;
  const planningAssetLocation = planningEvent?.asset.location?.name?.replace(/^00_/, '').toUpperCase()
    ?? parseAssetSerial(planningEvent?.asset.serial_number)?.locationCode
    ?? null;
  const workOrderById = useMemo(
    () => new Map(workOrders.map((workOrder) => [workOrder.id, workOrder])),
    [workOrders]
  );

  // Auto-fill supplier from external technician
  useEffect(() => {
    if (!selectedTechnician) return;
    if (selectedTechnician.employment_type === 'EXTERNAL') {
      setWoForm((f) => ({ ...f, supplier_id: selectedTechnician.supplier_id ?? '' }));
    } else {
      setWoForm((f) => ({ ...f, supplier_id: '' }));
    }
  }, [selectedTechnician]);

  const { calDays, eventsByDay, plannedByDay, inProgressByDay } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let d = calStart;
    while (d <= calEnd) {
      days.push(d);
      d = addDays(d, 1);
    }

    const map = new Map<string, CalendarEvent[]>();
    const plannedMap = new Map<string, CalendarEvent[]>();
    const inProgressMap = new Map<string, CalendarEvent[]>();
    const assetById = new Map(assets.map((asset) => [asset.id, asset]));
    const activeWorkOrdersByAssetId = new Map(
      workOrders
        .filter((workOrder) => ACTIVE_WORK_ORDER_STATUSES.has(workOrder.status))
        .map((workOrder) => [workOrder.asset_id, workOrder])
    );

    for (const asset of assets) {
      if (!asset.last_verification || !asset.verification_frequency_days) continue;

      const activeWorkOrder = activeWorkOrdersByAssetId.get(asset.id);
      if (activeWorkOrder?.planned_date) {
        const plannedKey = activeWorkOrder.planned_date.slice(0, 10);
        const plannedDate = new Date(`${plannedKey}T12:00:00`);
        const daysFromToday = differenceInDays(plannedDate, today);
        const normalizedAsset = assetById.get(activeWorkOrder.asset_id) ?? asset;
        const targetMap = activeWorkOrder.status === 'IN_PROGRESS' ? inProgressMap : plannedMap;

        if (!targetMap.has(plannedKey)) targetMap.set(plannedKey, []);
        targetMap.get(plannedKey)!.push({
          asset: normalizedAsset,
          daysFromToday,
          dayKey: plannedKey,
          workOrderId: activeWorkOrder.id,
          workOrderCode: activeWorkOrder.code,
          visualStatus: activeWorkOrder.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'PLANNED',
        });
        continue;
      }

      const occurrences = getOccurrencesInRange(
        asset.last_verification,
        asset.verification_frequency_days,
        calStart,
        calEnd,
      );
      for (const date of occurrences) {
        const key = format(date, 'yyyy-MM-dd');
        const daysFromToday = differenceInDays(date, today);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({
          asset,
          daysFromToday,
          dayKey: key,
          visualStatus: 'DUE',
        });
      }
    }

    map.forEach((events) => events.sort((a, b) => a.daysFromToday - b.daysFromToday));
    plannedMap.forEach((events) => events.sort((a, b) => a.asset.name.localeCompare(b.asset.name, 'it')));
    inProgressMap.forEach((events) => events.sort((a, b) => a.asset.name.localeCompare(b.asset.name, 'it')));

    return { calDays: days, eventsByDay: map, plannedByDay: plannedMap, inProgressByDay: inProgressMap };
  }, [assets, currentMonth, workOrders]);

  const counts = useMemo(() => ({
    SCADUTO: assets.filter((a) => a.status === 'SCADUTO').length,
    'IN SCADENZA': assets.filter((a) => a.status === 'IN SCADENZA').length,
    'IN LAVORAZIONE': assets.filter((a) => a.status === 'IN LAVORAZIONE').length,
    'IN REGOLA': assets.filter((a) => a.status === 'IN REGOLA').length,
  }), [assets]);

  const selectedEvents = selectedDay ? (eventsByDay.get(selectedDay) ?? []) : [];
  const matchesSupplierFilter = (event: CalendarEvent) => {
    if (supplierFilter === ALL_SUPPLIERS_VALUE) return true;
    const supplierId = event.workOrderId ? workOrderById.get(event.workOrderId)?.supplier_id ?? null : null;
    if (supplierFilter === NO_SUPPLIER_VALUE) return !supplierId;
    return supplierId === supplierFilter;
  };
  const selectedPlannedEvents = selectedDay ? (plannedByDay.get(selectedDay) ?? []).filter(matchesSupplierFilter) : [];
  const selectedInProgressEvents = selectedDay ? (inProgressByDay.get(selectedDay) ?? []).filter(matchesSupplierFilter) : [];

  const getEventSupplierName = (event: CalendarEvent) => {
    if (!event.workOrderId) return null;
    return workOrderById.get(event.workOrderId)?.supplier?.name ?? null;
  };

  const openSupplierEditor = (event: CalendarEvent) => {
    if (!event.workOrderId) return;
    const currentSupplierId = workOrderById.get(event.workOrderId)?.supplier_id ?? null;
    setEditingSupplierWorkOrderId(event.workOrderId);
    setEditingSupplierValue(currentSupplierId ?? NO_SUPPLIER_VALUE);
  };

  const saveSupplierChange = async () => {
    if (!editingSupplierWorkOrderId) return;
    setSavingSupplierChange(true);
    const nextSupplierId = editingSupplierValue === NO_SUPPLIER_VALUE ? null : editingSupplierValue;
    const { error } = await updateWorkOrder(editingSupplierWorkOrderId, { supplier_id: nextSupplierId });
    setSavingSupplierChange(false);

    if (error) {
      toast.error(error.message ?? 'Errore durante l\'aggiornamento del fornitore');
      return;
    }

    setEditingSupplierWorkOrderId(null);
    toast.success('Fornitore aggiornato');
  };

  const prevMonth = () => { setCurrentMonth((m) => subMonths(m, 1)); setSelectedDay(null); };
  const nextMonth = () => { setCurrentMonth((m) => addMonths(m, 1)); setSelectedDay(null); };
  const openRelatedWorkOrder = (asset: Asset, workOrderId?: string | null) => {
    navigate('/work-orders', {
      state: {
        workOrderId: workOrderId ?? null,
        assetSearch: asset.name,
      },
    });
  };

  const openWoModal = (asset: Asset, plannedDate: string) => {
    setWoAsset(asset);
    setWoForm({
      description: `Manutenzione programmata — ${asset.name}`,
      type: 'PROGRAMMED',
      priority: 'MEDIUM',
      planned_date: plannedDate,
      technician_id: '',
      supplier_id: '',
      notes: '',
    });
    setWoModalOpen(true);
  };

  const resetPlanningDragState = () => {
    setDraggedEvent(null);
    setDragOverDay(null);
    setPlanningEvent(null);
    setPlanningTargetDay(null);
    setPlanningSupplierId('');
    setPlanningViaDrag(false);
  };

  const handleEventDragStart = (event: CalendarEvent) => {
    setDraggedEvent(event);
  };

  const handleDropOnDay = async (targetDay: string) => {
    if (!draggedEvent) return;

    if (draggedEvent.visualStatus === 'PLANNED' && draggedEvent.workOrderId) {
      if (planningViaDrag) return;
      if (draggedEvent.dayKey === targetDay) {
        setDraggedEvent(null);
        setDragOverDay(null);
        return;
      }

      setPlanningViaDrag(true);
      const { error } = await updateWorkOrder(draggedEvent.workOrderId, { planned_date: targetDay });
      setPlanningViaDrag(false);

      if (error) {
        toast.error(error.message ?? 'Errore durante la ripianificazione del work order');
        return;
      }

      setSelectedDay(targetDay);
      resetPlanningDragState();
      toast.success(`WO ripianificato per il ${format(new Date(`${targetDay}T12:00:00`), 'd MMM', { locale: it })}`);
      return;
    }

    setPlanningEvent(draggedEvent);
    setPlanningTargetDay(targetDay);
    setPlanningSupplierId('');
    setPlanningModalOpen(true);
    setDragOverDay(null);
  };

  const handlePlanningConfirm = async () => {
    if (!planningEvent || !planningTargetDay) {
      toast.error('Asset o giorno di pianificazione non validi');
      return;
    }

    setPlanningViaDrag(true);

    try {
      const { error } = await createWorkOrder({
        asset_id: planningEvent.asset.id,
        type: 'PROGRAMMED',
        status: 'PLANNED',
        priority: 'MEDIUM',
        description: `Manutenzione pianificata — ${planningEvent.asset.name}`,
        technician_id: null,
        supplier_id: planningSupplierId || null,
        planned_date: planningTargetDay,
        executed_at: null,
        closed_at: null,
        validation_date: null,
        photos: [],
        cost: 0,
        notes: selectedPlanningSupplier ? `Fornitore pianificato: ${selectedPlanningSupplier.name}` : '',
        report_delivered: false,
        report_files: [],
      });

      if (error) {
        console.error('Schedule planning createWorkOrder failed:', error);
        toast.error(error.message ?? 'Errore durante la pianificazione visuale');
        return;
      }

      setSelectedDay(planningTargetDay);
      setPlanningModalOpen(false);
      resetPlanningDragState();
      toast.success(`Intervento pianificato per il ${format(new Date(`${planningTargetDay}T12:00:00`), 'd MMM', { locale: it })}`);
    } finally {
      setPlanningViaDrag(false);
    }
  };

  const handleWoSave = async () => {
    if (!woAsset) return;
    if (!woForm.description.trim()) {
      toast.error('La descrizione è obbligatoria');
      return;
    }
    setWoSaving(true);
    const { error } = await createWorkOrder({
      asset_id: woAsset.id,
      type: woForm.type,
      status: 'NEW',
      priority: woForm.priority,
      description: woForm.description.trim(),
      technician_id: woForm.technician_id || null,
      supplier_id: woForm.supplier_id || null,
      planned_date: woForm.planned_date || null,
      executed_at: null,
      closed_at: null,
      validation_date: null,
      photos: [],
      cost: 0,
      notes: woForm.notes,
      report_delivered: false,
      report_files: [],
    });
    setWoSaving(false);
    if (error) {
      toast.error(error.message ?? 'Errore nella creazione del work order');
      return;
    }
    const { error: assetErr } = await updateAsset(woAsset.id, { status_override: 'IN LAVORAZIONE' });
    if (assetErr) console.error('Failed to set asset status_override:', assetErr);
    toast.success('Work Order creato');
    setWoModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {([
          ['SCADUTO', 'bg-red-500', AlertTriangle],
          ['IN SCADENZA', 'bg-orange-500', Clock],
          ['IN LAVORAZIONE', 'bg-blue-500', Hammer],
          ['IN REGOLA', 'bg-emerald-500', CheckCircle2],
        ] as const).map(([status, color, Icon]) => (
          <Card key={status} className="border-none shadow-sm rounded-3xl">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center text-white', color)}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{counts[status]}</p>
                <p className="text-xs text-slate-500 font-medium">{status}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-[2rem] border border-slate-100 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-800">Vista planner</p>
            <p className="mt-1 text-sm text-slate-500">
              Filtra gli interventi per fornitore e aggiorna rapidamente i WO pianificati.
            </p>
          </div>
          <div className="w-full max-w-sm space-y-1.5">
            <Label>Filtro fornitore</Label>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="rounded-xl">
                <span className="truncate text-left">
                  {supplierFilter === ALL_SUPPLIERS_VALUE
                    ? 'Tutti i fornitori'
                    : supplierFilter === NO_SUPPLIER_VALUE
                      ? 'Senza fornitore'
                      : suppliers.find((supplier) => supplier.id === supplierFilter)?.name ?? 'Tutti i fornitori'}
                </span>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value={ALL_SUPPLIERS_VALUE}>Tutti i fornitori</SelectItem>
                <SelectItem value={NO_SUPPLIER_VALUE}>Senza fornitore</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            Scadenza da pianificare
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            Pianificato
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            In lavorazione
          </span>
        </div>
      </div>

      <div className={cn('grid gap-6', selectedDay ? 'xl:grid-cols-[22rem_minmax(0,1fr)]' : 'grid-cols-1')}>
        <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
          <CardContent className="p-0">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-primary" />
                <h3 className="text-lg font-bold text-slate-800">Backlog scadenze</h3>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {selectedDay
                  ? `Asset in scadenza il ${format(new Date(`${selectedDay}T12:00:00`), 'd MMMM yyyy', { locale: it })}`
                  : 'Seleziona un giorno con scadenze per trascinare gli asset nel calendario.'}
              </p>
            </div>
            <div className="max-h-[38rem] overflow-y-auto px-4 py-4">
              {!selectedDay ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                  Nessun giorno selezionato
                </div>
              ) : selectedEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                  Tutte le scadenze di questo giorno sono già state pianificate.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map((ev) => {
                    const locationRaw = ev.asset.location?.name?.replace(/^00_/, '').toUpperCase()
                      ?? parseAssetSerial(ev.asset.serial_number)?.locationCode
                      ?? null;

                    return (
                      <button
                        key={`backlog-${ev.asset.id}`}
                        type="button"
                        draggable
                        onDragStart={() => handleEventDragStart(ev)}
                        onDragEnd={() => {
                          setDraggedEvent(null);
                          setDragOverDay(null);
                        }}
                        className={cn(
                          'w-full rounded-3xl border px-4 py-4 text-left transition-all',
                          draggedEvent?.asset.id === ev.asset.id ? 'border-primary/40 bg-primary/5 opacity-70' : 'border-slate-200 bg-white hover:border-primary/30 hover:bg-slate-50'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-xl bg-slate-100 p-2 text-slate-500">
                            <GripVertical size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-bold text-slate-800">{ev.asset.name}</p>
                              {ev.asset.serial_number && (
                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                  {ev.asset.serial_number}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {ev.asset.category} · {ev.asset.brand} {ev.asset.model}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold', eventColor(ev.daysFromToday))}>
                                {ev.daysFromToday < 0
                                  ? `Scaduto da ${Math.abs(ev.daysFromToday)}g`
                                  : ev.daysFromToday === 0
                                    ? 'Scade oggi'
                                    : `Tra ${ev.daysFromToday}g`}
                              </span>
                              {locationRaw && (
                                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                  <MapPin size={10} />
                                  {locationRaw}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      {/* Calendar */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-lg font-bold text-slate-800 capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: it })}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DOW_LABELS.map((label, idx) => (
            <div
              key={label}
              className={cn(
                'text-center text-[11px] font-bold py-3 uppercase tracking-wider',
                idx >= 5 ? 'text-slate-300' : 'text-slate-400',
              )}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-50">
            {calDays.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const events = eventsByDay.get(key) ?? [];
              const plannedEvents = plannedByDay.get(key) ?? [];
              const inProgressEvents = inProgressByDay.get(key) ?? [];
              const inMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDay === key;
              const isTodayDay = isToday(day);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const hasDetails = events.length > 0 || plannedEvents.length > 0 || inProgressEvents.length > 0;

              return (
                <div
                  key={key}
                  onClick={() => hasDetails && setSelectedDay(isSelected ? null : key)}
                  onDragOver={(event) => {
                    if (!draggedEvent) return;
                    event.preventDefault();
                    setDragOverDay(key);
                  }}
                  onDragLeave={() => {
                    if (dragOverDay === key) {
                      setDragOverDay(null);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    void handleDropOnDay(key);
                  }}
                  className={cn(
                    'min-h-22.5 p-2 transition-colors',
                    isWeekend && !isSelected && !isTodayDay && 'bg-slate-50',
                    !inMonth && 'opacity-40',
                    isTodayDay && !isSelected && 'bg-primary/5',
                    isSelected && 'bg-blue-50',
                    dragOverDay === key && 'ring-2 ring-primary/40 ring-inset bg-primary/5',
                    hasDetails ? 'cursor-pointer hover:brightness-95' : 'cursor-default',
                  )}
                >
                  <div className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1 mx-auto',
                    isTodayDay
                      ? 'bg-primary text-white font-bold'
                      : isWeekend
                      ? inMonth ? 'text-slate-400 font-medium' : 'text-slate-300'
                      : inMonth ? 'text-slate-700 font-medium' : 'text-slate-300',
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {events.slice(0, 3).map((ev) => (
                      <div
                        key={ev.asset.id}
                        className={cn(
                          'text-[10px] font-semibold rounded px-1.5 py-0.5 truncate leading-tight',
                          eventColor(ev.daysFromToday),
                        )}
                      >
                        {ev.asset.name}
                      </div>
                    ))}
                    {plannedEvents.filter(matchesSupplierFilter).slice(0, 2).map((ev) => (
                      <div
                        key={`planned-${ev.workOrderId ?? ev.asset.id}`}
                        draggable={Boolean(ev.workOrderId)}
                        onDragStart={(event) => {
                          event.stopPropagation();
                          handleEventDragStart(ev);
                        }}
                        onDragEnd={() => {
                          setDraggedEvent(null);
                          setDragOverDay(null);
                        }}
                        className={cn(
                          'truncate rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-indigo-700 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]',
                          ev.workOrderId && 'cursor-grab active:cursor-grabbing'
                        )}
                      >
                        {ev.workOrderCode ?? 'WO pianificato'} · {ev.asset.name}
                      </div>
                    ))}
                    {events.length > 3 && (
                      <div className="text-[10px] text-slate-400 font-medium px-1">
                        +{events.length - 3} altri
                      </div>
                    )}
                    {plannedEvents.filter(matchesSupplierFilter).length > 2 && (
                      <div className="px-1 text-[10px] font-medium text-indigo-500">
                        +{plannedEvents.filter(matchesSupplierFilter).length - 2} pianificati
                      </div>
                    )}
                    {inProgressEvents.filter(matchesSupplierFilter).length > 0 && (
                      <div className="rounded px-1 text-[10px] font-semibold leading-tight text-sky-600">
                        {inProgressEvents.filter(matchesSupplierFilter).length} in lavorazione
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>

      {/* Detail panel */}
      {selectedDay && (selectedPlannedEvents.length > 0 || selectedInProgressEvents.length > 0) && (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-lg capitalize">
              {format(new Date(`${selectedDay}T12:00:00`), 'd MMMM yyyy', { locale: it })}
            </h3>
            <span className="text-sm text-slate-400 font-medium">
              {selectedPlannedEvents.length} {selectedPlannedEvents.length === 1 ? 'intervento pianificato' : 'interventi pianificati'}
            </span>
          </div>
          {selectedPlannedEvents.length > 0 && (
            <div className="divide-y divide-slate-50">
              {selectedPlannedEvents.map((ev) => {
              const locationRaw = ev.asset.location?.name?.replace(/^00_/, '').toUpperCase()
                ?? parseAssetSerial(ev.asset.serial_number)?.locationCode
                ?? null;
              return (
              <div
                key={ev.asset.id}
                draggable={Boolean(ev.workOrderId)}
                onDragStart={() => handleEventDragStart(ev)}
                onDragEnd={() => {
                  setDraggedEvent(null);
                  setDragOverDay(null);
                }}
                className={cn(
                  'flex items-center gap-4 px-8 py-5 transition-colors',
                  ev.workOrderId ? 'cursor-grab hover:bg-slate-50/50 active:cursor-grabbing' : 'hover:bg-slate-50/50'
                )}
              >
                <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-800 truncate">{ev.asset.name}</p>
                    {ev.asset.serial_number && (
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md shrink-0">
                        {ev.asset.serial_number}
                      </span>
                    )}
                          {ev.workOrderCode && (
                            <span className="shrink-0 rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                              {ev.workOrderCode}
                            </span>
                          )}
                          {workOrders.find((workOrder) => workOrder.id === ev.workOrderId)?.supplier?.name && (
                            <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700">
                              {getEventSupplierName(ev)}
                            </span>
                          )}
                        </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-500">{ev.asset.category} · {ev.asset.brand} {ev.asset.model} · ogni {ev.asset.verification_frequency_days}gg</span>
                    {locationRaw && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <MapPin size={10} />
                        {locationRaw}
                      </span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-bold text-indigo-700">
                  Pianificato
                </span>
                {ev.workOrderId && (
                  <button
                    type="button"
                    onDragStart={() => handleEventDragStart(ev)}
                    onDragEnd={() => {
                      setDraggedEvent(null);
                      setDragOverDay(null);
                    }}
                    draggable
                    className="hidden shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 lg:inline-flex"
                  >
                    <GripVertical size={11} />
                    Trascina
                  </button>
                )}
                {ev.workOrderId && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl gap-1.5 shrink-0 border-slate-200"
                    onClick={() => openSupplierEditor(ev)}
                  >
                    <Truck size={13} />
                    Fornitore
                  </Button>
                )}
                <Button size="sm" variant="outline" className="rounded-xl gap-1.5 shrink-0" onClick={() => openRelatedWorkOrder(ev.asset, ev.workOrderId)}>
                  <FolderOpen size={13} />
                  Apri WO
                </Button>
              </div>
              );
              })}
            </div>
          )}

          {selectedInProgressEvents.length > 0 && (
            <div className={cn(selectedPlannedEvents.length > 0 && 'border-t border-slate-100')}>
              <div className="flex items-center justify-between bg-sky-50/80 px-8 py-4">
                <div className="flex items-center gap-2">
                  <Hammer size={16} className="text-sky-600" />
                  <p className="text-sm font-bold text-sky-800">Gia presi in carico</p>
                </div>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
                  {selectedInProgressEvents.length}
                </span>
              </div>
              <div className="divide-y divide-slate-50">
                {selectedInProgressEvents.map((ev) => {
                  const locationRaw = ev.asset.location?.name?.replace(/^00_/, '').toUpperCase()
                    ?? parseAssetSerial(ev.asset.serial_number)?.locationCode
                    ?? null;
                  return (
                    <div key={`in-progress-${ev.asset.id}`} className="flex items-center gap-4 px-8 py-5 bg-sky-50/30">
                      <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-bold text-slate-800">{ev.asset.name}</p>
                          {ev.asset.serial_number && (
                            <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                              {ev.asset.serial_number}
                            </span>
                          )}
                          {ev.workOrderCode && (
                            <span className="shrink-0 rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                              {ev.workOrderCode}
                            </span>
                          )}
                          <span className="shrink-0 rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-700">
                            In lavorazione
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-3">
                          <span className="text-xs text-slate-500">{ev.asset.category} · {ev.asset.brand} {ev.asset.model}</span>
                          {locationRaw && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <MapPin size={10} />
                              {locationRaw}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1.5 rounded-xl border-sky-200 bg-white text-sky-700 hover:bg-sky-50 hover:text-sky-800"
                        onClick={() => openRelatedWorkOrder(ev.asset, ev.workOrderId)}
                      >
                        <FolderOpen size={13} />
                        Apri WO
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* WO creation dialog */}
      <Dialog open={woModalOpen} onOpenChange={setWoModalOpen}>
        <DialogContent className="sm:max-w-2xl rounded-[2rem] p-0 overflow-hidden">
          <DialogHeader className="border-b px-8 py-6">
            <DialogTitle className="text-2xl font-bold">Avvia manutenzione</DialogTitle>
            {woAsset && (() => {
              const loc = woAsset.location?.name?.replace(/^00_/, '').toUpperCase()
                ?? parseAssetSerial(woAsset.serial_number)?.locationCode
                ?? null;
              return (
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span className="text-sm text-slate-500">{woAsset.name} · {woAsset.category}</span>
                  {woAsset.serial_number && (
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">{woAsset.serial_number}</span>
                  )}
                  {loc && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <MapPin size={10} />
                      {loc}
                    </span>
                  )}
                </div>
              );
            })()}
          </DialogHeader>

          <div className="grid gap-4 px-8 py-6">
            <div className="space-y-1.5">
              <Label>Descrizione *</Label>
              <Textarea
                value={woForm.description}
                onChange={(e) => setWoForm((f) => ({ ...f, description: e.target.value }))}
                className="rounded-2xl min-h-20"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={woForm.type} onValueChange={(v) => setWoForm((f) => ({ ...f, type: v as WorkOrderType }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {TYPES.map((t) => <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Priorità</Label>
                <Select value={woForm.priority} onValueChange={(v) => setWoForm((f) => ({ ...f, priority: v as Priority }))}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Data pianificata</Label>
                <Input
                  type="date"
                  value={woForm.planned_date}
                  onChange={(e) => setWoForm((f) => ({ ...f, planned_date: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tecnico</Label>
                <Select value={woForm.technician_id} onValueChange={(v) => setWoForm((f) => ({ ...f, technician_id: v }))}>
                  <SelectTrigger className="rounded-xl">
                    <span className="truncate text-left">
                      {selectedTechnician
                        ? `${selectedTechnician.name}${selectedTechnician.supplier?.name ? ` · ${selectedTechnician.supplier.name}` : ''}`
                        : 'Nessuno'}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="">Nessuno</SelectItem>
                    {technicians.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} · {TECHNICIAN_EMPLOYMENT_LABELS[t.employment_type]}
                        {t.supplier?.name ? ` · ${t.supplier.name}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Fornitore</Label>
                <Select
                  value={woForm.supplier_id}
                  onValueChange={(v) => setWoForm((f) => ({ ...f, supplier_id: v }))}
                  disabled={selectedTechnician?.employment_type === 'EXTERNAL'}
                >
                  <SelectTrigger className="rounded-xl">
                    <span className="truncate text-left">
                      {suppliers.find((s) => s.id === woForm.supplier_id)?.name ?? 'Nessuno'}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="">Nessuno</SelectItem>
                    {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {selectedTechnician?.employment_type === 'EXTERNAL' && (
                  <p className="text-xs text-slate-400">
                    Fornitore collegato: {selectedTechnician.supplier?.name ?? 'non impostato'}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Note</Label>
              <Textarea
                value={woForm.notes}
                onChange={(e) => setWoForm((f) => ({ ...f, notes: e.target.value }))}
                className="rounded-2xl min-h-17.5"
                rows={2}
                placeholder="Annotazioni aggiuntive..."
              />
            </div>
          </div>

          <DialogFooter className="border-t px-8 py-6 gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setWoModalOpen(false)}>
              Annulla
            </Button>
            <Button className="rounded-xl gap-2" onClick={handleWoSave} disabled={woSaving}>
              <Wrench size={14} />
              {woSaving ? 'Creazione...' : 'Crea Work Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={planningModalOpen}
        onOpenChange={(open) => {
          setPlanningModalOpen(open);
          if (!open) {
            resetPlanningDragState();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-[2rem] p-0 overflow-hidden">
          <DialogHeader className="border-b px-8 py-6">
            <DialogTitle className="text-2xl font-bold">Pianifica intervento</DialogTitle>
            {planningEvent && planningTargetDay && (
              <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold text-white">
                    Asset
                  </span>
                  <span className="text-base font-bold text-slate-800">{planningEvent.asset.name}</span>
                  {planningEvent.asset.serial_number && (
                    <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500">
                      {planningEvent.asset.serial_number}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span>{planningEvent.asset.category}</span>
                  <span>{planningEvent.asset.brand} {planningEvent.asset.model}</span>
                  {planningAssetLocation && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {planningAssetLocation}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold text-blue-700">
                    Pianificato per il {format(new Date(`${planningTargetDay}T12:00:00`), 'd MMMM yyyy', { locale: it })}
                  </span>
                </div>
              </div>
            )}
          </DialogHeader>

          <div className="grid gap-4 px-8 py-6">
            <div className="space-y-1.5">
              <Label>Fornitore</Label>
              <Select
                value={planningSupplierId || NO_SUPPLIER_VALUE}
                onValueChange={(value) => setPlanningSupplierId(value === NO_SUPPLIER_VALUE ? '' : value)}
              >
                <SelectTrigger className="rounded-xl">
                  <span className="truncate text-left">
                    {selectedPlanningSupplier?.name ?? 'Nessun fornitore'}
                  </span>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={NO_SUPPLIER_VALUE}>Nessun fornitore</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">
                Il WO verrà creato in stato pianificato e potrai completarlo successivamente.
              </p>
              {selectedPlanningSupplier && (
                <p className="text-xs font-medium text-slate-500">
                  Fornitore selezionato: {selectedPlanningSupplier.name}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="border-t px-8 py-5">
            <Button variant="outline" className="rounded-xl" onClick={() => setPlanningModalOpen(false)}>
              Annulla
            </Button>
            <Button className="rounded-xl" onClick={handlePlanningConfirm} disabled={planningViaDrag}>
              {planningViaDrag ? 'Pianificazione...' : 'Conferma pianificazione'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingSupplierWorkOrderId)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingSupplierWorkOrderId(null);
            setEditingSupplierValue(NO_SUPPLIER_VALUE);
            setSavingSupplierChange(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-[2rem] p-0 overflow-hidden">
          <DialogHeader className="border-b px-8 py-6">
            <DialogTitle className="text-2xl font-bold">Aggiorna fornitore</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 px-8 py-6">
            <div className="space-y-1.5">
              <Label>Fornitore</Label>
              <Select value={editingSupplierValue} onValueChange={setEditingSupplierValue}>
                <SelectTrigger className="rounded-xl">
                  <span className="truncate text-left">
                    {editingSupplierValue === NO_SUPPLIER_VALUE
                      ? 'Nessun fornitore'
                      : suppliers.find((supplier) => supplier.id === editingSupplierValue)?.name ?? 'Nessun fornitore'}
                  </span>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={NO_SUPPLIER_VALUE}>Nessun fornitore</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">
                Modifica rapida del fornitore senza uscire dal planner.
              </p>
            </div>
          </div>

          <DialogFooter className="border-t px-8 py-5">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setEditingSupplierWorkOrderId(null);
                setEditingSupplierValue(NO_SUPPLIER_VALUE);
              }}
            >
              Annulla
            </Button>
            <Button className="rounded-xl" onClick={saveSupplierChange} disabled={savingSupplierChange}>
              {savingSupplierChange ? 'Salvataggio...' : 'Salva fornitore'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
