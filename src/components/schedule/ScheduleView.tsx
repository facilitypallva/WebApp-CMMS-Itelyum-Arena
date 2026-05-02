import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle, Clock, CheckCircle2, Wrench, Hammer, MapPin, FolderOpen, CalendarDays, GripVertical, Truck, X } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AnimatedSaveButton } from '@/components/ui/animated-save-button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAssets } from '@/hooks/useAssets';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import { useTechnicians } from '@/hooks/useTechnicians';
import { useSuppliers } from '@/hooks/useSuppliers';
import { PRIORITY_LABELS, TECHNICIAN_EMPLOYMENT_LABELS } from '@/lib/constants';
import { parseAssetSerial } from '@/lib/assetUtils';
import { AssetCategoryIcon } from '@/components/assets/AssetCategoryIcon';
import { BulkSelectionStack, DragFollowerPreview, DraggableAssetCard, DropCalendarCell } from './DragDropMotion';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isToday, differenceInDays,
} from 'date-fns';
import { it } from 'date-fns/locale';
import { Asset, AssetStatus, Priority, WorkOrder, WorkOrderType } from '@/types';
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
const STATUS_FILTERS: Array<{ status: AssetStatus; color: string; Icon: typeof AlertTriangle }> = [
  { status: 'SCADUTO', color: 'bg-red-500', Icon: AlertTriangle },
  { status: 'IN SCADENZA', color: 'bg-orange-500', Icon: Clock },
  { status: 'IN LAVORAZIONE', color: 'bg-blue-500', Icon: Hammer },
  { status: 'IN REGOLA', color: 'bg-emerald-500', Icon: CheckCircle2 },
];

interface WoFormState {
  description: string;
  type: WorkOrderType;
  priority: Priority;
  planned_date: string;
  technician_id: string;
  supplier_id: string;
  notes: string;
}

function buildCalendarData(assets: Asset[], workOrders: WorkOrder[], targetMonth: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = startOfMonth(targetMonth);
  const monthEnd = endOfMonth(targetMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days: Date[] = [];
  let d = calStart;
  while (d <= calEnd) { days.push(d); d = addDays(d, 1); }
  const map = new Map<string, CalendarEvent[]>();
  const plannedMap = new Map<string, CalendarEvent[]>();
  const inProgressMap = new Map<string, CalendarEvent[]>();
  const assetById = new Map(assets.map((a) => [a.id, a]));
  const activeWOByAssetId = new Map<string, WorkOrder>(
    workOrders.filter((wo) => ACTIVE_WORK_ORDER_STATUSES.has(wo.status)).map((wo) => [wo.asset_id, wo] as const)
  );
  for (const asset of assets) {
    if (!asset.last_verification || !asset.verification_frequency_days) continue;
    const activeWO = activeWOByAssetId.get(asset.id);
    if (activeWO?.planned_date) {
      const key = activeWO.planned_date.slice(0, 10);
      const daysFromToday = differenceInDays(new Date(`${key}T12:00:00`), today);
      const targetMap = activeWO.status === 'IN_PROGRESS' ? inProgressMap : plannedMap;
      if (!targetMap.has(key)) targetMap.set(key, []);
      targetMap.get(key)!.push({
        asset: assetById.get(activeWO.asset_id) ?? asset,
        daysFromToday, dayKey: key, workOrderId: activeWO.id, workOrderCode: activeWO.code,
        visualStatus: activeWO.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'PLANNED',
      });
      continue;
    }
    for (const date of getOccurrencesInRange(asset.last_verification, asset.verification_frequency_days, calStart, calEnd)) {
      const key = format(date, 'yyyy-MM-dd');
      const daysFromToday = differenceInDays(date, today);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ asset, daysFromToday, dayKey: key, visualStatus: 'DUE' });
    }
  }
  map.forEach((evs) => evs.sort((a, b) => a.daysFromToday - b.daysFromToday));
  plannedMap.forEach((evs) => evs.sort((a, b) => a.asset.name.localeCompare(b.asset.name, 'it')));
  inProgressMap.forEach((evs) => evs.sort((a, b) => a.asset.name.localeCompare(b.asset.name, 'it')));
  return { calDays: days, eventsByDay: map, plannedByDay: plannedMap, inProgressByDay: inProgressMap };
}

const PLANNING_MONTHS: Date[] = Array.from({ length: 12 }, (_, i) => addMonths(startOfMonth(new Date()), i));

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
  const [planningEvents, setPlanningEvents] = useState<CalendarEvent[]>([]);
  const [selectedBacklogAssetIds, setSelectedBacklogAssetIds] = useState<string[]>([]);
  const [groupingBacklogAssetIds, setGroupingBacklogAssetIds] = useState<string[]>([]);
  const [hiddenGroupedBacklogAssetIds, setHiddenGroupedBacklogAssetIds] = useState<string[]>([]);
  const [dropSuccessAssetIds, setDropSuccessAssetIds] = useState<string[]>([]);
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number; title: string; count: number } | null>(null);

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
  const [statusFilter, setStatusFilter] = useState<AssetStatus | null>(null);
  const [editingSupplierWorkOrderId, setEditingSupplierWorkOrderId] = useState<string | null>(null);
  const [editingSupplierValue, setEditingSupplierValue] = useState(NO_SUPPLIER_VALUE);
  const [savingSupplierChange, setSavingSupplierChange] = useState(false);
  const [planningAsset, setPlanningAsset] = useState<Asset | null>(null);
  const [planningRightMode, setPlanningRightMode] = useState<'months' | 'calendar' | null>(null);
  const [planningCalendarMonth, setPlanningCalendarMonth] = useState<Date>(() => startOfMonth(new Date()));

  const selectedTechnician = technicians.find((t) => t.id === woForm.technician_id) ?? null;
  const selectedPlanningSupplier = suppliers.find((supplier) => supplier.id === planningSupplierId) ?? null;
  const planningAssetLocation = planningEvent?.asset.location?.name?.replace(/^00_/, '').toUpperCase()
    ?? parseAssetSerial(planningEvent?.asset.serial_number)?.locationCode
    ?? null;
  const workOrderById = useMemo(
    () => new Map(workOrders.map((workOrder) => [workOrder.id, workOrder])),
    [workOrders]
  );
  const activeWorkOrderByAssetId = useMemo(
    () => new Map(
      workOrders
        .filter((workOrder) => ACTIVE_WORK_ORDER_STATUSES.has(workOrder.status))
        .map((workOrder) => [workOrder.asset_id, workOrder] as const)
    ),
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

  const { calDays, eventsByDay, plannedByDay, inProgressByDay } = useMemo(
    () => buildCalendarData(assets, workOrders, currentMonth),
    [assets, workOrders, currentMonth],
  );

  const { calDays: planCalDays, eventsByDay: planEventsByDay, plannedByDay: planPlannedByDay, inProgressByDay: planInProgressByDay } = useMemo(
    () => buildCalendarData(assets, workOrders, planningCalendarMonth),
    [assets, workOrders, planningCalendarMonth],
  );

  const counts = useMemo(() => ({
    SCADUTO: assets.filter((a) => a.status === 'SCADUTO').length,
    'IN SCADENZA': assets.filter((a) => a.status === 'IN SCADENZA').length,
    'IN LAVORAZIONE': assets.filter((a) => a.status === 'IN LAVORAZIONE').length,
    'IN REGOLA': assets.filter((a) => a.status === 'IN REGOLA').length,
  }), [assets]);

  const matchesStatusFilter = (event: CalendarEvent) => !statusFilter || event.asset.status === statusFilter;
  const selectedEvents = selectedDay ? (eventsByDay.get(selectedDay) ?? []).filter(matchesStatusFilter) : [];
  const selectedPlannedEvents = selectedDay ? (plannedByDay.get(selectedDay) ?? []).filter(matchesStatusFilter) : [];
  const selectedInProgressEvents = selectedDay ? (inProgressByDay.get(selectedDay) ?? []).filter(matchesStatusFilter) : [];
  const planningPreviewEvents = planningEvents.length > 0 ? planningEvents : planningEvent ? [planningEvent] : [];
  const selectedBacklogEvents = useMemo(
    () => selectedEvents.filter((event) => selectedBacklogAssetIds.includes(event.asset.id)),
    [selectedBacklogAssetIds, selectedEvents],
  );
  const groupingBacklogAssetIdSet = useMemo(
    () => new Set(groupingBacklogAssetIds),
    [groupingBacklogAssetIds],
  );
  const hiddenGroupedBacklogAssetIdSet = useMemo(
    () => new Set(selectedBacklogEvents.length > 1 ? hiddenGroupedBacklogAssetIds : []),
    [hiddenGroupedBacklogAssetIds, selectedBacklogEvents.length],
  );
  const visibleBacklogEvents = useMemo(
    () => selectedEvents.filter((event) => !hiddenGroupedBacklogAssetIdSet.has(event.asset.id)),
    [hiddenGroupedBacklogAssetIdSet, selectedEvents],
  );
  const allBacklogSelected = selectedEvents.length > 0 && selectedBacklogEvents.length === selectedEvents.length;
  const selectedPlannedFromBacklog = useMemo(() => {
    if (!selectedDay) return [];
    const selectedDateStart = new Date(`${selectedDay}T00:00:00`);
    const selectedDateEnd = new Date(`${selectedDay}T23:59:59`);

    return assets
      .flatMap((asset) => {
        if (!asset.last_verification || !asset.verification_frequency_days) return [];
        if (statusFilter && asset.status !== statusFilter) return [];

        const activeWorkOrder = activeWorkOrderByAssetId.get(asset.id);
        if (!activeWorkOrder?.planned_date || activeWorkOrder.status === 'IN_PROGRESS') return [];

        const isDueOnSelectedDay = getOccurrencesInRange(
          asset.last_verification,
          asset.verification_frequency_days,
          selectedDateStart,
          selectedDateEnd,
        ).some((date) => format(date, 'yyyy-MM-dd') === selectedDay);

        if (!isDueOnSelectedDay) return [];

        return [{
          asset,
          workOrder: activeWorkOrder,
          plannedKey: activeWorkOrder.planned_date.slice(0, 10),
        }];
      })
      .sort((a, b) => {
        const dateCompare = a.plannedKey.localeCompare(b.plannedKey);
        return dateCompare || a.asset.name.localeCompare(b.asset.name, 'it');
      });
  }, [activeWorkOrderByAssetId, assets, selectedDay, statusFilter]);

  useEffect(() => {
    setSelectedBacklogAssetIds((current) => {
      const validIds = new Set(selectedEvents.map((event) => event.asset.id));
      const next = current.filter((id) => validIds.has(id));
      if (next.length === current.length) return current;
      return next;
    });
  }, [selectedEvents]);

  useEffect(() => {
    if (selectedBacklogAssetIds.length <= 1) {
      setGroupingBacklogAssetIds([]);
      setHiddenGroupedBacklogAssetIds([]);
      return;
    }

    setHiddenGroupedBacklogAssetIds((current) => (
      current.filter((id) => selectedBacklogAssetIds.includes(id))
    ));
    setGroupingBacklogAssetIds(selectedBacklogAssetIds);

    const timeoutId = window.setTimeout(() => {
      setHiddenGroupedBacklogAssetIds(selectedBacklogAssetIds);
      setGroupingBacklogAssetIds([]);
    }, 430);

    return () => window.clearTimeout(timeoutId);
  }, [selectedBacklogAssetIds]);

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

  const prevMonth = () => {
    setCurrentMonth((m) => subMonths(m, 1));
    closeDayDrawer();
  };
  const nextMonth = () => {
    setCurrentMonth((m) => addMonths(m, 1));
    closeDayDrawer();
  };
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
    setDragPreview(null);
    setPlanningEvent(null);
    setPlanningEvents([]);
    setPlanningTargetDay(null);
    setPlanningSupplierId('');
    setPlanningViaDrag(false);
  };

  const selectDay = (dayKey: string) => {
    const targetDate = new Date(`${dayKey}T12:00:00`);
    setSelectedDay(dayKey);
    setCurrentMonth(startOfMonth(targetDate));
  };

  const closeDayDrawer = () => {
    setSelectedDay(null);
    setPlanningAsset(null);
    setPlanningRightMode(null);
    setPlanningCalendarMonth(startOfMonth(new Date()));
    setSelectedBacklogAssetIds([]);
    setGroupingBacklogAssetIds([]);
    setHiddenGroupedBacklogAssetIds([]);
    setPlanningModalOpen(false);
    resetPlanningDragState();
  };

  const toggleBacklogSelection = (assetId: string, checked: boolean) => {
    setSelectedBacklogAssetIds((current) => {
      if (checked) {
        return current.includes(assetId) ? current : [...current, assetId];
      }

      return current.filter((id) => id !== assetId);
    });
  };

  const toggleAllBacklogSelection = (checked: boolean) => {
    setSelectedBacklogAssetIds(checked ? selectedEvents.map((event) => event.asset.id) : []);
  };

  const updateDragPreviewPosition = (clientX: number, clientY: number) => {
    if (clientX === 0 && clientY === 0) return;
    setDragPreview((current) => current
      ? { ...current, x: clientX, y: clientY }
      : current);
  };

  const handleEventDragStart = (event: CalendarEvent, pointerEvent: ReactPointerEvent<HTMLElement>) => {
    const selectedEventsToDrag = event.visualStatus === 'DUE' && selectedBacklogAssetIds.includes(event.asset.id)
      ? selectedBacklogEvents.length > 0 ? selectedBacklogEvents : [event]
      : [event];

    setDragPreview({
      x: pointerEvent.clientX,
      y: pointerEvent.clientY,
      title: event.asset.name,
      count: selectedEventsToDrag.length,
    });

    if (event.visualStatus === 'DUE' && selectedBacklogAssetIds.includes(event.asset.id)) {
      setPlanningAsset(selectedEventsToDrag[0]?.asset ?? event.asset);
      setPlanningEvents(selectedEventsToDrag);
      setDraggedEvent(event);
      return;
    }

    setPlanningAsset(event.asset);
    setPlanningEvents([event]);
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

      setDropSuccessAssetIds([draggedEvent.asset.id]);
      window.setTimeout(() => {
        setDropSuccessAssetIds((current) => current.filter((id) => id !== draggedEvent.asset.id));
      }, 500);
      resetPlanningDragState();
      toast.success(`WO ripianificato per il ${format(new Date(`${targetDay}T12:00:00`), 'd MMM', { locale: it })}`);
      return;
    }

    const eventsToPlan = planningEvents.length > 0
      ? planningEvents.filter((event) => event.visualStatus === 'DUE')
      : [draggedEvent];

    setPlanningEvent(eventsToPlan[0] ?? draggedEvent);
    setPlanningEvents(eventsToPlan.length > 0 ? eventsToPlan : [draggedEvent]);
    setPlanningTargetDay(targetDay);
    setPlanningSupplierId('');
    setPlanningModalOpen(true);
    setDragOverDay(null);
  };

  useEffect(() => {
    if (!draggedEvent) return;

    const findDropDay = (clientX: number, clientY: number) => {
      const element = document.elementFromPoint(clientX, clientY);
      return element instanceof HTMLElement
        ? element.closest<HTMLElement>('[data-schedule-drop-day]')?.dataset.scheduleDropDay ?? null
        : null;
    };

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      updateDragPreviewPosition(event.clientX, event.clientY);
      setDragOverDay(findDropDay(event.clientX, event.clientY));
    };

    const handlePointerUp = (event: globalThis.PointerEvent) => {
      const targetDay = findDropDay(event.clientX, event.clientY);
      setDragPreview(null);

      if (!targetDay) {
        setDraggedEvent(null);
        setDragOverDay(null);
        return;
      }

      void handleDropOnDay(targetDay);
    };

    const handlePointerCancel = () => {
      setDraggedEvent(null);
      setDragOverDay(null);
      setDragPreview(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    };
  });

  const handlePlanningConfirm = async () => {
    const eventsToCreate = planningEvents.length > 0 ? planningEvents : planningEvent ? [planningEvent] : [];
    if (eventsToCreate.length === 0 || !planningTargetDay) {
      toast.error('Asset o giorno di pianificazione non validi');
      return;
    }

    setPlanningViaDrag(true);

    try {
      for (const event of eventsToCreate) {
        const { error } = await createWorkOrder({
          asset_id: event.asset.id,
          type: 'PROGRAMMED',
          status: 'PLANNED',
          priority: 'MEDIUM',
          description: `Manutenzione pianificata — ${event.asset.name}`,
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
      }

      const plannedAssetIds = new Set(eventsToCreate.map((event) => event.asset.id));
      setDropSuccessAssetIds([...plannedAssetIds]);
      window.setTimeout(() => {
        setDropSuccessAssetIds((current) => current.filter((id) => !plannedAssetIds.has(id)));
      }, 500);
      setSelectedBacklogAssetIds((current) => current.filter((id) => !plannedAssetIds.has(id)));
      setPlanningModalOpen(false);
      resetPlanningDragState();
      toast.success(
        eventsToCreate.length === 1
          ? `Intervento pianificato per il ${format(new Date(`${planningTargetDay}T12:00:00`), 'd MMM', { locale: it })}`
          : `${eventsToCreate.length} interventi pianificati per il ${format(new Date(`${planningTargetDay}T12:00:00`), 'd MMM', { locale: it })}`
      );
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
    <div>
      <div className="arena-card flex h-[calc(100dvh-10.5rem)] min-h-[32rem] flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-slate-100 px-5 py-3 lg:px-6">
          <button onClick={prevMonth} className="h-10 w-10 rounded-xl text-slate-500 transition-colors hover:bg-slate-100">
            <ChevronLeft size={18} />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <h2 className="min-w-fit text-lg font-bold capitalize text-slate-800 lg:text-2xl">
              {format(currentMonth, 'MMMM yyyy', { locale: it })}
            </h2>
            <div className="flex min-w-0 items-center gap-2 overflow-x-auto">
              {STATUS_FILTERS.map(({ status, color, Icon }) => {
                const isActive = statusFilter === status;

                return (
                  <button
                    key={status}
                    type="button"
                    aria-label={`Filtra ${status.toLowerCase()}`}
                    title={status}
                    onClick={() => setStatusFilter((current) => (current === status ? null : status))}
                    className={cn(
                      'flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border text-slate-700 transition-all',
                      isActive
                        ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                    )}
                  >
                    <span className={cn('flex h-6 w-6 items-center justify-center rounded-lg text-white', color)}>
                      <Icon size={14} />
                    </span>
                    <span className="text-xs font-bold leading-none">{counts[status]}</span>
                  </button>
                );
              })}
              <button
                type="button"
                aria-label="Rimuovi filtri calendario"
                title="Rimuovi filtri"
                onClick={() => setStatusFilter(null)}
                className={cn(
                  'flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border transition-all',
                  statusFilter
                    ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    : 'border-slate-200 bg-slate-50 text-slate-300',
                )}
              >
                <X size={18} />
                <span className="text-xs font-bold leading-none">{assets.length}</span>
              </button>
            </div>
          </div>
          <button onClick={nextMonth} className="ml-auto h-10 w-10 rounded-xl text-slate-500 transition-colors hover:bg-slate-100">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid shrink-0 grid-cols-7 border-b border-slate-100">
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
          <div className="flex flex-1 justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div
            className="grid min-h-0 flex-1 grid-cols-7 divide-x divide-y divide-slate-50"
            style={{ gridTemplateRows: `repeat(${Math.ceil(calDays.length / 7)}, minmax(0, 1fr))` }}
          >
            {calDays.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const events = (eventsByDay.get(key) ?? []).filter(matchesStatusFilter);
              const plannedEvents = (plannedByDay.get(key) ?? []).filter(matchesStatusFilter);
              const inProgressEvents = (inProgressByDay.get(key) ?? []).filter(matchesStatusFilter);
              const cellEvents = [...events, ...plannedEvents, ...inProgressEvents];
              const inMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDay === key;
              const isTodayDay = isToday(day);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const hasDetails = cellEvents.length > 0;

              return (
                <DropCalendarCell
                  key={key}
                  onClick={() => {
                    if (!hasDetails) return;
                    if (isSelected) {
                      closeDayDrawer();
                      return;
                    }
                    selectDay(key);
                  }}
                  dropDay={key}
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
                    if (!draggedEvent) return;
                    event.preventDefault();
                    void handleDropOnDay(key);
                  }}
                  className={cn(
                    'min-h-0 overflow-hidden p-2 transition-all duration-200',
                    isWeekend && !isSelected && !isTodayDay && 'bg-slate-50',
                    !inMonth && 'opacity-40',
                    isTodayDay && !isSelected && 'bg-primary/5',
                    isSelected && 'bg-blue-50',
                    dragOverDay === key && 'scale-[0.985] bg-primary/5 ring-2 ring-primary/40 ring-inset shadow-inner',
                    hasDetails ? 'cursor-pointer hover:brightness-95' : 'cursor-default',
                  )}
                  isDragOver={dragOverDay === key}
                >
                  <div className={cn(
                    'mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm',
                    isTodayDay
                      ? 'bg-primary text-white font-bold'
                      : isWeekend
                      ? inMonth ? 'text-slate-400 font-medium' : 'text-slate-300'
                      : inMonth ? 'text-slate-700 font-medium' : 'text-slate-300',
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="flex flex-wrap justify-center gap-1 overflow-hidden">
                    {cellEvents.slice(0, 8).map((ev, index) => (
                      <div
                        key={`${ev.visualStatus ?? 'due'}-${ev.workOrderId ?? ev.asset.id}-${index}`}
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-md border bg-white shadow-sm',
                          ev.visualStatus === 'PLANNED' && 'border-indigo-200 bg-indigo-50',
                          ev.visualStatus === 'IN_PROGRESS' && 'border-sky-200 bg-sky-50',
                          ev.visualStatus === 'DUE' && ev.daysFromToday < 0 && 'border-red-200 bg-red-50',
                          ev.visualStatus === 'DUE' && ev.daysFromToday >= 0 && ev.daysFromToday <= 30 && 'border-orange-200 bg-orange-50',
                          ev.visualStatus === 'DUE' && ev.daysFromToday > 30 && 'border-emerald-200 bg-emerald-50',
                        )}
                        title={ev.asset.name}
                      >
                        <AssetCategoryIcon category={ev.asset.category} size={14} />
                      </div>
                    ))}
                    {cellEvents.length > 8 && (
                      <div className="flex h-6 min-w-6 items-center justify-center rounded-md bg-slate-100 px-1.5 text-[10px] font-bold text-slate-500">
                        +{cellEvents.length - 8}
                      </div>
                    )}
                  </div>
                </DropCalendarCell>
              );
            })}
          </div>
        )}
      </div>

      {/* Day drawer */}
      <Sheet
        open={selectedDay !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeDayDrawer();
          }
        }}
      >
        <SheetContent
          side="left"
          showCloseButton={false}
          style={{ width: 'auto', maxWidth: 'none' }}
          className="flex flex-row gap-0 p-0 data-[side=left]:w-auto data-[side=left]:sm:max-w-none"
        >
          {/* Left panel */}
          <div className="flex w-[370px] shrink-0 flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="font-bold text-slate-800">
                  {selectedDay ? format(new Date(`${selectedDay}T12:00:00`), 'd MMMM yyyy', { locale: it }) : ''}
                </h3>
                <p className="mt-0.5 text-xs text-slate-400">Scadenze del giorno</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  closeDayDrawer();
                }}
              >
                <X size={16} />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto py-3">
              {selectedEvents.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center justify-between gap-3 px-5 pb-1 pt-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={allBacklogSelected}
                        onCheckedChange={(value) => toggleAllBacklogSelection(!!value)}
                      />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Backlog scadenze
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {selectedBacklogEvents.length > 0
                        ? `${selectedBacklogEvents.length} selezionati`
                        : `${selectedEvents.length} asset`}
                    </span>
                  </div>
                  <BulkSelectionStack
                    count={selectedBacklogEvents.length}
                    names={selectedBacklogEvents.map((event) => event.asset.name)}
                    onPointerDragStart={(event) => {
                      const firstSelectedEvent = selectedBacklogEvents[0];
                      if (!firstSelectedEvent) return;
                      setPlanningAsset(firstSelectedEvent.asset);
                      handleEventDragStart(firstSelectedEvent, event);
                    }}
                    onClear={() => setSelectedBacklogAssetIds([])}
                  />
                  <div className="space-y-1 px-3">
                    {visibleBacklogEvents.map((ev) => {
                      const isBulkSelected = selectedBacklogAssetIds.includes(ev.asset.id);
                      const loc = ev.asset.location?.name?.replace(/^00_/, '').toUpperCase()
                        ?? parseAssetSerial(ev.asset.serial_number)?.locationCode
                        ?? null;
                      return (
                        <DraggableAssetCard
                          key={`bl-${ev.asset.id}`}
                          onPointerDragStart={(event) => {
                            setPlanningAsset(ev.asset);
                            handleEventDragStart(ev, event);
                          }}
                          isDragging={draggedEvent?.asset.id === ev.asset.id}
                          isSelected={isBulkSelected || planningAsset?.id === ev.asset.id}
                          isGrouped={groupingBacklogAssetIdSet.has(ev.asset.id)}
                          isDropSuccess={dropSuccessAssetIds.includes(ev.asset.id)}
                          className={cn(
                            'flex items-center gap-2 rounded-xl border px-3 py-3 transition-colors duration-200 ease-out',
                            isBulkSelected
                              ? 'border-primary/40 bg-primary/5 shadow-sm'
                              : planningAsset?.id === ev.asset.id
                              ? 'border-primary/40 bg-primary/5 shadow-sm'
                              : draggedEvent?.asset.id === ev.asset.id
                              ? 'border-primary/40 bg-primary/5'
                              : 'border-slate-200 bg-white hover:border-primary/30 hover:bg-slate-50',
                          )}
                        >
                          <Checkbox
                            checked={isBulkSelected}
                            onCheckedChange={(value) => toggleBacklogSelection(ev.asset.id, !!value)}
                            className="shrink-0"
                          />
                          <GripVertical size={14} className="shrink-0 text-slate-300 transition-colors group-hover:text-primary" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-800">{ev.asset.name}</p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', eventColor(ev.daysFromToday))}>
                                {ev.daysFromToday < 0
                                  ? `Scaduto da ${Math.abs(ev.daysFromToday)}g`
                                  : ev.daysFromToday === 0
                                    ? 'Scade oggi'
                                    : `Tra ${ev.daysFromToday}g`}
                              </span>
                              {loc && (
                                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                  <MapPin size={9} />
                                  {loc}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPlanningAsset(ev.asset);
                              setPlanningRightMode('months');
                              if (selectedBacklogAssetIds.includes(ev.asset.id)) {
                                setPlanningEvents(selectedBacklogEvents.length > 0 ? selectedBacklogEvents : [ev]);
                              } else {
                                setPlanningEvents([ev]);
                              }
                            }}
                            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary"
                            title="Pianifica"
                          >
                            <CalendarDays size={16} />
                          </button>
                        </DraggableAssetCard>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedPlannedFromBacklog.length > 0 && (
                <div className="mb-2">
                  <p className="px-5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                    Riepilogo pianificati
                  </p>
                  <div className="space-y-1 px-3">
                    {selectedPlannedFromBacklog.map(({ asset, workOrder, plannedKey }) => {
                      const supplierName = workOrder.supplier?.name ?? null;

                      return (
                        <div
                          key={`planned-summary-${workOrder.id}`}
                          className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-3"
                        >
                          <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-800">{asset.name}</p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                              {workOrder.code && (
                                <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                  {workOrder.code}
                                </span>
                              )}
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                {format(new Date(`${plannedKey}T12:00:00`), 'd MMM', { locale: it })}
                              </span>
                              {supplierName && (
                                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                  {supplierName}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => openRelatedWorkOrder(asset, workOrder.id)}
                            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-600"
                            title="Apri WO"
                          >
                            <FolderOpen size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedPlannedEvents.length > 0 && (
                <div className="mb-2">
                  <p className="px-5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Pianificati
                  </p>
                  <div className="space-y-1 px-3">
                    {selectedPlannedEvents.map((ev) => {
                      const loc = ev.asset.location?.name?.replace(/^00_/, '').toUpperCase()
                        ?? parseAssetSerial(ev.asset.serial_number)?.locationCode
                        ?? null;
                      return (
                        <DraggableAssetCard
                          key={`pl-${ev.asset.id}`}
                          draggable={Boolean(ev.workOrderId)}
                          onPointerDragStart={(event) => {
                            setPlanningAsset(ev.asset);
                            handleEventDragStart(ev, event);
                          }}
                          isDragging={draggedEvent?.asset.id === ev.asset.id}
                          isSelected={planningAsset?.id === ev.asset.id}
                          isDropSuccess={dropSuccessAssetIds.includes(ev.asset.id)}
                          className={cn(
                            'flex items-center gap-2 rounded-xl border px-3 py-3 transition-colors duration-200 ease-out',
                            ev.workOrderId
                              ? draggedEvent?.asset.id === ev.asset.id
                                ? 'border-indigo-200 bg-indigo-50 cursor-grab'
                                : 'cursor-grab border-indigo-100 bg-indigo-50/50 hover:border-indigo-200'
                              : 'border-slate-200 bg-white',
                          )}
                        >
                          {ev.workOrderId && <GripVertical size={14} className="shrink-0 text-indigo-300 transition-colors group-hover:text-indigo-500" />}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-800">{ev.asset.name}</p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                              {ev.workOrderCode && (
                                <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                  {ev.workOrderCode}
                                </span>
                              )}
                              {getEventSupplierName(ev) && (
                                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                                  {getEventSupplierName(ev)}
                                </span>
                              )}
                              {loc && (
                                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                  <MapPin size={9} />
                                  {loc}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            {ev.workOrderId && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPlanningAsset(ev.asset);
                                  setPlanningRightMode('months');
                                }}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary"
                                title="Ripianifica"
                              >
                                <CalendarDays size={14} />
                              </button>
                            )}
                            {ev.workOrderId && (
                              <button
                                type="button"
                                onClick={() => openSupplierEditor(ev)}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                                title="Fornitore"
                              >
                                <Truck size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openRelatedWorkOrder(ev.asset, ev.workOrderId)}
                              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                              title="Apri WO"
                            >
                              <FolderOpen size={14} />
                            </button>
                          </div>
                        </DraggableAssetCard>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedInProgressEvents.length > 0 && (
                <div className="mb-2">
                  <p className="px-5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-sky-500">
                    In lavorazione
                  </p>
                  <div className="space-y-1 px-3">
                    {selectedInProgressEvents.map((ev) => {
                      const loc = ev.asset.location?.name?.replace(/^00_/, '').toUpperCase()
                        ?? parseAssetSerial(ev.asset.serial_number)?.locationCode
                        ?? null;
                      return (
                        <div
                          key={`ip-${ev.asset.id}`}
                          className="flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50/50 px-3 py-3"
                        >
                          <div className="h-2 w-2 shrink-0 rounded-full bg-sky-400" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-800">{ev.asset.name}</p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                              {ev.workOrderCode && (
                                <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                  {ev.workOrderCode}
                                </span>
                              )}
                              {loc && (
                                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                  <MapPin size={9} />
                                  {loc}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => openRelatedWorkOrder(ev.asset, ev.workOrderId)}
                            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                            title="Apri WO"
                          >
                            <FolderOpen size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedEvents.length === 0 && selectedPlannedFromBacklog.length === 0 && selectedPlannedEvents.length === 0 && selectedInProgressEvents.length === 0 && (
                <div className="px-5 py-8 text-center text-sm text-slate-400">
                  Nessuna scadenza per questo giorno.
                </div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div
            className={cn(
              'flex flex-col overflow-hidden border-l border-slate-100 transition-[width] duration-300',
              planningRightMode ? 'w-[620px]' : 'w-0',
            )}
          >
            {planningAsset && (
              <>
                <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pianifica</p>
                    <p className="truncate font-bold text-slate-800">{planningAsset.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setPlanningAsset(null); setPlanningRightMode(null); }}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100"
                  >
                    <X size={16} />
                  </button>
                </div>

                {planningRightMode === 'months' && (
                  <div className="flex-1 overflow-y-auto p-5">
                    <p className="mb-4 text-sm font-bold text-slate-700">Seleziona un mese</p>
                    <div className="grid grid-cols-3 gap-3">
                      {PLANNING_MONTHS.map((month) => (
                        <button
                          key={month.toISOString()}
                          type="button"
                          onClick={() => {
                            setPlanningCalendarMonth(month);
                            setPlanningRightMode('calendar');
                          }}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-4 text-center transition-all hover:border-primary/40 hover:bg-primary/5"
                        >
                          <p className="text-sm font-bold capitalize text-slate-800">
                            {format(month, 'MMMM', { locale: it })}
                          </p>
                          <p className="text-xs text-slate-400">{format(month, 'yyyy')}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {planningRightMode === 'calendar' && (
                  <div className="flex min-h-0 flex-1 flex-col">
                    <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-100 px-4 py-2">
                      {PLANNING_MONTHS.map((month) => (
                        <button
                          key={month.toISOString()}
                          type="button"
                          onClick={() => setPlanningCalendarMonth(month)}
                          className={cn(
                            'shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors',
                            isSameMonth(month, planningCalendarMonth)
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-500 hover:bg-slate-100',
                          )}
                        >
                          {format(month, 'MMM', { locale: it })}
                        </button>
                      ))}
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col p-4">
                      <p className="mb-3 text-sm font-bold capitalize text-slate-700">
                        {format(planningCalendarMonth, 'MMMM yyyy', { locale: it })}
                      </p>
                      <div className="mb-1 grid grid-cols-7 border-b border-slate-100 pb-1">
                        {DOW_LABELS.map((label, idx) => (
                          <div
                            key={label}
                            className={cn(
                              'py-1 text-center text-[10px] font-bold uppercase tracking-wider',
                              idx >= 5 ? 'text-slate-300' : 'text-slate-400',
                            )}
                          >
                            {label}
                          </div>
                        ))}
                      </div>
                      <div
                        className="grid min-h-0 flex-1 grid-cols-7 divide-x divide-y divide-slate-50 overflow-hidden rounded-xl border border-slate-100"
                        style={{ gridTemplateRows: `repeat(${Math.ceil(planCalDays.length / 7)}, minmax(0, 1fr))` }}
                      >
                        {planCalDays.map((day) => {
                          const key = format(day, 'yyyy-MM-dd');
                          const planEvents = [
                            ...(planEventsByDay.get(key) ?? []).filter(matchesStatusFilter),
                            ...(planPlannedByDay.get(key) ?? []).filter(matchesStatusFilter),
                            ...(planInProgressByDay.get(key) ?? []).filter(matchesStatusFilter),
                          ];
                          const inMonth = isSameMonth(day, planningCalendarMonth);
                          const isTodayDay = isToday(day);
                          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                          const isDragOver = dragOverDay === key;
                          return (
                            <DropCalendarCell
                              key={key}
                              dropDay={key}
                              onClick={() => {
                                selectDay(key);
                              }}
                              onDragOver={(e) => {
                                if (!draggedEvent) return;
                                e.preventDefault();
                                setDragOverDay(key);
                              }}
                              onDragLeave={() => { if (dragOverDay === key) setDragOverDay(null); }}
                              onDrop={(e) => {
                                if (!draggedEvent) return;
                                e.preventDefault();
                                void handleDropOnDay(key);
                              }}
                              className={cn(
                                'cursor-pointer overflow-hidden p-1.5 transition-all duration-200 hover:bg-slate-50',
                                isWeekend && !isTodayDay && 'bg-slate-50/60',
                                !inMonth && 'opacity-30',
                                isTodayDay && 'bg-primary/5',
                                isDragOver && 'scale-[0.985] bg-primary/5 ring-2 ring-inset ring-primary/40 shadow-inner',
                              )}
                              isDragOver={isDragOver}
                            >
                              <div className={cn(
                                'mx-auto mb-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs',
                                isTodayDay
                                  ? 'bg-primary font-bold text-white'
                                  : isWeekend
                                    ? inMonth ? 'font-medium text-slate-400' : 'text-slate-300'
                                    : inMonth ? 'font-medium text-slate-700' : 'text-slate-300',
                              )}>
                                {format(day, 'd')}
                              </div>
                              <div className="flex flex-wrap justify-center gap-0.5 overflow-hidden">
                                {planEvents.slice(0, 4).map((ev, index) => (
                                  <div
                                    key={`pe-${ev.visualStatus ?? 'due'}-${ev.workOrderId ?? ev.asset.id}-${index}`}
                                    className={cn(
                                      'h-4 w-4 rounded-sm border bg-white',
                                      ev.visualStatus === 'PLANNED' && 'border-indigo-200 bg-indigo-50',
                                      ev.visualStatus === 'IN_PROGRESS' && 'border-sky-200 bg-sky-50',
                                      ev.visualStatus === 'DUE' && ev.daysFromToday < 0 && 'border-red-200 bg-red-50',
                                      ev.visualStatus === 'DUE' && ev.daysFromToday >= 0 && ev.daysFromToday <= 30 && 'border-orange-200 bg-orange-50',
                                      ev.visualStatus === 'DUE' && ev.daysFromToday > 30 && 'border-emerald-200 bg-emerald-50',
                                    )}
                                    title={ev.asset.name}
                                  />
                                ))}
                                {planEvents.length > 4 && (
                                  <div className="flex h-4 min-w-4 items-center justify-center rounded-sm bg-slate-100 px-0.5 text-[9px] font-bold text-slate-500">
                                    +{planEvents.length - 4}
                                  </div>
                                )}
                              </div>
                            </DropCalendarCell>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <DragFollowerPreview
        visible={Boolean(dragPreview)}
        x={dragPreview?.x ?? 0}
        y={dragPreview?.y ?? 0}
        title={dragPreview?.title ?? ''}
        count={dragPreview?.count ?? 1}
      />

      {/* WO creation dialog */}
      <Dialog open={woModalOpen} onOpenChange={setWoModalOpen}>
        <DialogContent className="sm:max-w-2xl rounded-xl p-0 overflow-hidden">
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
                className="rounded-lg min-h-20"
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
                <Select value={woForm.technician_id} onValueChange={(v) => setWoForm((f) => ({ ...f, technician_id: v ?? '' }))}>
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
                  onValueChange={(v) => setWoForm((f) => ({ ...f, supplier_id: v ?? '' }))}
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
                className="rounded-lg min-h-17.5"
                rows={2}
                placeholder="Annotazioni aggiuntive..."
              />
            </div>
          </div>

          <DialogFooter className="border-t px-8 py-6 gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setWoModalOpen(false)}>
              Annulla
            </Button>
            <AnimatedSaveButton
              onClick={handleWoSave}
              isSaving={woSaving}
              idleLabel="Crea Work Order"
              savingLabel="Creazione..."
              idleIcon={<Wrench size={14} />}
            />
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
        <DialogContent className="sm:max-w-lg rounded-xl p-0 overflow-hidden">
          <DialogHeader className="border-b px-8 py-6">
            <DialogTitle className="text-2xl font-bold">
              {planningPreviewEvents.length > 1
                ? `Pianifica ${planningPreviewEvents.length} interventi`
                : 'Pianifica intervento'}
            </DialogTitle>
            {planningPreviewEvents.length > 0 && planningTargetDay && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold text-white">
                    {planningPreviewEvents.length > 1 ? `${planningPreviewEvents.length} asset` : 'Asset'}
                  </span>
                  <span className="text-base font-bold text-slate-800">
                    {planningPreviewEvents.length > 1
                      ? 'Pianificazione massiva'
                      : planningPreviewEvents[0].asset.name}
                  </span>
                  {planningPreviewEvents.length === 1 && planningPreviewEvents[0].asset.serial_number && (
                    <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-slate-500">
                      {planningPreviewEvents[0].asset.serial_number}
                    </span>
                  )}
                </div>
                {planningPreviewEvents.length > 1 ? (
                  <div className="mt-3 max-h-28 space-y-1 overflow-y-auto">
                    {planningPreviewEvents.map((event) => (
                      <div key={event.asset.id} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
                        <span className="truncate text-sm font-semibold text-slate-700">{event.asset.name}</span>
                        {event.asset.serial_number && (
                          <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                            {event.asset.serial_number}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span>{planningPreviewEvents[0].asset.category}</span>
                    <span>{planningPreviewEvents[0].asset.brand} {planningPreviewEvents[0].asset.model}</span>
                    {planningAssetLocation && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {planningAssetLocation}
                      </span>
                    )}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold text-blue-700">
                    {planningPreviewEvents.length > 1 ? 'Pianificati' : 'Pianificato'} per il {format(new Date(`${planningTargetDay}T12:00:00`), 'd MMMM yyyy', { locale: it })}
                  </span>
                  {planningPreviewEvents.length > 1 && (
                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-500">
                      Conferma unica con lo stesso fornitore
                    </span>
                  )}
                </div>
              </div>
            )}
          </DialogHeader>

          <div className="grid gap-4 px-8 py-6">
            <div className="space-y-1.5">
              <Label>Fornitore</Label>
              <Select
                value={planningSupplierId || NO_SUPPLIER_VALUE}
                onValueChange={(value) => setPlanningSupplierId(value === NO_SUPPLIER_VALUE ? '' : (value ?? ''))}
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
            <AnimatedSaveButton
              onClick={handlePlanningConfirm}
              isSaving={planningViaDrag}
              idleLabel={planningPreviewEvents.length > 1 ? 'Conferma pianificazione massiva' : 'Conferma pianificazione'}
              savingLabel="Pianificazione..."
            />
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
        <DialogContent className="sm:max-w-md rounded-xl p-0 overflow-hidden">
          <DialogHeader className="border-b px-8 py-6">
            <DialogTitle className="text-2xl font-bold">Aggiorna fornitore</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 px-8 py-6">
            <div className="space-y-1.5">
              <Label>Fornitore</Label>
              <Select value={editingSupplierValue} onValueChange={(v) => setEditingSupplierValue(v ?? '')}>
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
            <AnimatedSaveButton
              onClick={saveSupplierChange}
              isSaving={savingSupplierChange}
              idleLabel="Salva fornitore"
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
