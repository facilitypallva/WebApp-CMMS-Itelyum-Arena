import React, { useEffect, useState, useMemo } from 'react';
import { Clock, Plus, ChevronRight, Search, FileCheck, Paperclip, Download, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AnimatedSaveButton } from '@/components/ui/animated-save-button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { WorkOrder, WorkOrderStatus, WorkOrderType, Priority } from '@/types';
import { PRIORITY_LABELS, TECHNICIAN_EMPLOYMENT_LABELS, WORK_ORDER_STATUS_LABELS, WORK_ORDER_TYPE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import { useAssets } from '@/hooks/useAssets';
import { useTechnicians } from '@/hooks/useTechnicians';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { runResilientRequest, withRequestTimeout } from '@/lib/resilientRequest';
import { waitForSaveFeedback, waitForSaveSuccessFeedback } from '@/lib/saveFeedback';
import { useLocation, useNavigate } from 'react-router-dom';

type TicketDraftState = {
  id: string;
  code: string;
  reporter_name: string;
  reporter_email: string;
  location_name: string | null;
  problem_category: string | null;
  description: string;
  asset_id: string | null;
  photo_url: string | null;
};

function buildTicketWorkOrderDescription(ticket: TicketDraftState) {
  const context = [
    ticket.code ? `Ticket ${ticket.code}` : null,
    ticket.problem_category ? `Categoria: ${ticket.problem_category}` : null,
    ticket.location_name ? `Ubicazione: ${ticket.location_name}` : null,
    `Segnalato da: ${ticket.reporter_name} (${ticket.reporter_email})`,
  ].filter(Boolean);

  return [ticket.description.trim(), context.join(' • ')].filter(Boolean).join('\n\n');
}

const BUCKET = 'rapportini';

function storagePath(assetId: string, woId: string, fileName: string) {
  return `${assetId}/${woId}/${fileName}`;
}

function fileNameFromPath(path: string) {
  return path.split('/').pop() ?? path;
}

const STATUS_LABELS = WORK_ORDER_STATUS_LABELS;
const TYPE_LABELS = WORK_ORDER_TYPE_LABELS;
const PRIORITY_TRANSLATIONS = PRIORITY_LABELS;
const STATUSES: WorkOrderStatus[] = ['NEW', 'PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'SUSPENDED', 'CLOSED', 'VALIDATED', 'ABANDONED'];
const TYPES: WorkOrderType[] = ['PROGRAMMED', 'CORRECTIVE', 'EXTRA'];
const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const STATUS_FLOW: WorkOrderStatus[] = ['NEW', 'PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'CLOSED', 'VALIDATED'];
const NEXT_STATUS_MAP: Partial<Record<WorkOrderStatus, WorkOrderStatus>> = {
  NEW: 'PLANNED',
  PLANNED: 'ASSIGNED',
  ASSIGNED: 'IN_PROGRESS',
  IN_PROGRESS: 'CLOSED',
  SUSPENDED: 'IN_PROGRESS',
  CLOSED: 'VALIDATED',
};

function StatusBadge({ status }: { status: WorkOrderStatus }) {
  const cls =
    status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
    status === 'CLOSED' || status === 'VALIDATED' ? 'bg-emerald-100 text-emerald-700' :
    status === 'ABANDONED' ? 'bg-slate-900 text-white' :
    status === 'SUSPENDED' ? 'bg-red-100 text-red-700' :
    status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
    status === 'PLANNED' ? 'bg-slate-100 text-slate-700' :
    'bg-sky-50 text-sky-700';
  return (
    <Badge className={cn(cls, 'gap-1.5 border-none rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-[0.16em]')}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const cls =
    priority === 'CRITICAL' || priority === 'HIGH' ? 'bg-red-100 text-red-700' :
    priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
    'bg-blue-100 text-blue-700';

  return (
    <Badge className={cn(cls, 'gap-1.5 border-none rounded-md px-2.5 py-1 font-bold text-[11px] uppercase tracking-[0.12em]')}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {PRIORITY_TRANSLATIONS[priority]}
    </Badge>
  );
}

function getInitials(name: string | null | undefined) {
  if (!name) return 'NA';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}

function getWorkOrderTitle(workOrder: WorkOrder) {
  return workOrder.description?.split('\n')[0]?.trim() || workOrder.asset?.name || 'Ordine di lavoro';
}

function getAssetSubtitle(workOrder: WorkOrder) {
  const parts = [
    workOrder.asset?.name,
    workOrder.asset?.category,
    workOrder.asset?.location?.name?.replace(/^00_/, ''),
  ].filter(Boolean);

  return parts.join(' · ') || TYPE_LABELS[workOrder.type];
}

function getPrimaryActionLabel(status: WorkOrderStatus) {
  if (status === 'NEW') return 'Pianifica';
  if (status === 'PLANNED') return 'Prendi in carico';
  if (status === 'ASSIGNED') return 'Avvia';
  if (status === 'IN_PROGRESS') return 'Chiudi';
  if (status === 'SUSPENDED') return 'Riprendi';
  if (status === 'CLOSED') return 'Valida';
  return 'Completato';
}

function WorkOrderTimeline({
  status,
  interactive = false,
  onStepClick,
}: {
  status: WorkOrderStatus;
  interactive?: boolean;
  onStepClick?: (status: WorkOrderStatus) => void;
}) {
  const currentIndex = status === 'SUSPENDED'
    ? STATUS_FLOW.indexOf('IN_PROGRESS')
    : STATUS_FLOW.indexOf(status);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STATUS_FLOW.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = step === status || (status === 'SUSPENDED' && step === 'IN_PROGRESS');

          return (
            <React.Fragment key={step}>
              <div className="flex min-w-fit items-center gap-2">
                <button
                  type="button"
                  disabled={!interactive || !onStepClick}
                  onClick={() => onStepClick?.(step)}
                  className={cn(
                    'flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-[10px] font-bold transition-colors',
                    interactive && onStepClick ? 'cursor-pointer hover:scale-105' : 'cursor-default',
                    isCurrent
                      ? status === 'SUSPENDED'
                        ? 'border-red-200 bg-red-100 text-red-700 dark:border-red-500/35 dark:bg-red-500/20 dark:text-red-200'
                        : 'border-primary/20 bg-primary text-white dark:border-blue-400/40 dark:bg-blue-600 dark:text-white'
                      : isCompleted
                        ? 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-400/35 dark:bg-emerald-500/20 dark:text-emerald-200'
                        : 'border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500'
                  )}
                >
                  {index + 1}
                </button>
                <span className={cn('text-[11px] font-semibold whitespace-nowrap', isCurrent ? 'text-slate-800' : 'text-slate-400')}>
                  {STATUS_LABELS[step]}
                </span>
              </div>
              {index < STATUS_FLOW.length - 1 && (
                <div className={cn('h-px w-7 shrink-0', index < currentIndex ? 'bg-emerald-300' : 'bg-slate-200')} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {status === 'SUSPENDED' && (
        <p className="text-xs font-medium text-red-600">Intervento sospeso: puoi riprenderlo riportandolo In corso.</p>
      )}
      {status === 'ABANDONED' && (
        <p className="text-xs font-medium text-slate-600">Intervento abbandonato: stato finale, non modificabile.</p>
      )}
      {status === 'VALIDATED' && (
        <p className="text-xs font-medium text-emerald-700">Intervento validato: stato finale, non modificabile.</p>
      )}
    </div>
  );
}

const EMPTY_FORM = {
  asset_id: '', type: 'CORRECTIVE' as WorkOrderType, status: 'NEW' as WorkOrderStatus,
  priority: 'MEDIUM' as Priority, description: '', technician_id: '', supplier_id: '',
  planned_date: '', executed_at: '', cost: '', notes: '', report_delivered: false,
};

export function WorkOrdersList({
  globalSearch = '',
  onGlobalSearchChange,
}: {
  globalSearch?: string;
  onGlobalSearchChange?: (value: string) => void;
}) {
  const { workOrders, loading, createWorkOrder, updateWorkOrder, deleteWorkOrder } = useWorkOrders();
  const { assets } = useAssets();
  const { technicians } = useTechnicians();
  const { suppliers } = useSuppliers();
  const { isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<WorkOrderStatus | 'ALL'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WorkOrder | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [reportFiles, setReportFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [ticketDraft, setTicketDraft] = useState<TicketDraftState | null>(null);
  const searchValue = onGlobalSearchChange ? globalSearch : search;
  const selectedTechnician = technicians.find((technician) => technician.id === form.technician_id) ?? null;
  const technicianIsExternal = selectedTechnician?.employment_type === 'EXTERNAL';
  const selectedAsset = assets.find((asset) => asset.id === form.asset_id) ?? null;
  const selectedSupplier = suppliers.find((supplier) => supplier.id === form.supplier_id) ?? null;
  const isTerminalStatus = form.status === 'VALIDATED' || form.status === 'ABANDONED';

  const filtered = useMemo(() => workOrders.filter((wo) => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const matchSearch = !normalizedSearch || wo.description.toLowerCase().includes(normalizedSearch) ||
      wo.asset?.name?.toLowerCase().includes(normalizedSearch);
    const matchStatus = filterStatus === 'ALL' || wo.status === filterStatus;
    return matchSearch && matchStatus;
  }), [workOrders, searchValue, filterStatus]);

  const filteredAssets = useMemo(() => {
    const query = assetSearchQuery.trim().toLowerCase();

    if (!query) {
      return assets.slice(0, 25);
    }

    return assets
      .filter((asset) => {
        const haystack = [
          asset.name,
          asset.serial_number,
          asset.brand,
          asset.model,
          asset.location?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(query);
      })
      .slice(0, 25);
  }, [assets, assetSearchQuery]);

  const openCreate = () => {
    setTicketDraft(null);
    setEditing(null);
    setForm(EMPTY_FORM);
    setReportFiles([]);
    setAssetSearchQuery('');
    setAssetPopoverOpen(false);
    setModalOpen(true);
  };
  const openCreateFromTicket = (ticket: TicketDraftState) => {
    setEditing(null);
    setTicketDraft(ticket);
    setForm({
      ...EMPTY_FORM,
      asset_id: ticket.asset_id ?? '',
      type: 'CORRECTIVE',
      status: 'NEW',
      priority: 'MEDIUM',
      description: buildTicketWorkOrderDescription(ticket),
      notes: ticket.photo_url ? `Foto allegata ticket: ${ticket.photo_url}` : '',
    });
    setReportFiles([]);
    setAssetSearchQuery('');
    setAssetPopoverOpen(false);
    setModalOpen(true);
  };
  const openEdit = (wo: WorkOrder) => {
    setTicketDraft(null);
    setEditing(wo);
    setForm({
      asset_id: wo.asset_id, type: wo.type, status: wo.status, priority: wo.priority,
      description: wo.description ?? '', technician_id: wo.technician_id ?? '',
      supplier_id: wo.supplier_id ?? '',
      planned_date: wo.planned_date ? wo.planned_date.slice(0, 10) : '',
      executed_at: wo.executed_at ? wo.executed_at.slice(0, 10) : '',
      cost: wo.cost?.toString() ?? '', notes: wo.notes ?? '',
      report_delivered: wo.report_delivered ?? false,
    });
    setReportFiles(wo.report_files ?? []);
    setAssetSearchQuery('');
    setAssetPopoverOpen(false);
    setModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editing || !form.asset_id) return;
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Il file non può superare 10 MB');
      return;
    }

    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const path = storagePath(form.asset_id, editing.id, safeName);

    setUploading(true);
    try {
      const { error: uploadError } = await withRequestTimeout(
        () => supabase.storage.from(BUCKET).upload(path, file),
        30_000,
        'Timeout nel caricamento del file'
      );
      if (uploadError) { toast.error('Errore nel caricamento del file'); return; }

      const nextFiles = [...reportFiles, path];
      const { error: dbError } = await runResilientRequest(
        (signal) => supabase.from('work_orders').update({ report_files: nextFiles }).eq('id', editing.id).abortSignal(signal),
        { label: 'WO files update', timeoutMessage: 'Timeout nel salvataggio del file' }
      );
      if (dbError) {
        await supabase.storage.from(BUCKET).remove([path]);
        toast.error('Errore nel salvataggio: il file è stato rimosso, riprovare');
        return;
      }

      setReportFiles(nextFiles);
      toast.success('File allegato');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nel caricamento del file');
    } finally {
      setUploading(false);
    }
  };

  const handleFileDownload = async (path: string) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
    if (error || !data?.signedUrl) { toast.error('Impossibile aprire il file'); return; }
    window.open(data.signedUrl, '_blank');
  };

  const handleFileDelete = async (path: string) => {
    if (!editing) return;
    try {
      const { error: storageError } = await withRequestTimeout(
        () => supabase.storage.from(BUCKET).remove([path]),
        15_000,
        'Timeout nella rimozione del file'
      );
      if (storageError) { toast.error('Errore nella rimozione del file'); return; }

      const nextFiles = reportFiles.filter((f) => f !== path);
      const { error: dbError } = await runResilientRequest(
        (signal) => supabase.from('work_orders').update({ report_files: nextFiles }).eq('id', editing.id).abortSignal(signal),
        { label: 'WO files delete', timeoutMessage: 'Timeout nel salvataggio' }
      );
      if (dbError) {
        toast.error('File rimosso dallo storage ma errore nel salvataggio: ricaricare la pagina');
        return;
      }

      setReportFiles(nextFiles);
      toast.success('File rimosso');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nella rimozione del file');
    }
  };

  useEffect(() => {
    if (!selectedTechnician) return;

    if (selectedTechnician.employment_type === 'EXTERNAL') {
      const nextSupplierId = selectedTechnician.supplier_id ?? '';
      if (form.supplier_id !== nextSupplierId) {
        setForm((current) => ({ ...current, supplier_id: nextSupplierId }));
      }
      return;
    }

    if (form.supplier_id) {
      setForm((current) => ({ ...current, supplier_id: '' }));
    }
  }, [form.supplier_id, selectedTechnician]);

  useEffect(() => {
    const nextTicketDraft = (location.state as { ticketDraft?: TicketDraftState } | null)?.ticketDraft;
    if (!nextTicketDraft) return;

    openCreateFromTicket(nextTicketDraft);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (onGlobalSearchChange) return;

    const nextState = (location.state as { workOrderId?: string; assetSearch?: string } | null);
    if (nextState?.workOrderId) return;

    const nextAssetSearch = nextState?.assetSearch;
    if (!nextAssetSearch) return;

    setSearch(nextAssetSearch);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate, onGlobalSearchChange]);

  useEffect(() => {
    const nextWorkOrderId = (location.state as { workOrderId?: string; assetSearch?: string } | null)?.workOrderId;
    if (!nextWorkOrderId) return;

    const matchingWorkOrder = workOrders.find((workOrder) => workOrder.id === nextWorkOrderId);
    if (!matchingWorkOrder) return;

    openEdit(matchingWorkOrder);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate, workOrders]);

  const buildWorkOrderPayload = (nextForm = form) => {
    const nowIso = new Date().toISOString();
    const shouldClose = nextForm.status === 'CLOSED' || nextForm.status === 'VALIDATED';

    return {
      asset_id: nextForm.asset_id,
      type: nextForm.type,
      status: nextForm.status,
      priority: nextForm.priority,
      description: nextForm.description,
      technician_id: nextForm.technician_id || null,
      supplier_id: nextForm.supplier_id || null,
      planned_date: nextForm.planned_date || null,
      executed_at: nextForm.executed_at || null,
      cost: nextForm.cost ? parseFloat(nextForm.cost) : 0,
      notes: nextForm.notes,
      report_delivered: nextForm.report_delivered,
      report_files: reportFiles,
      photos: [],
      closed_at: shouldClose ? (editing?.closed_at ?? nowIso) : null,
      validation_date: nextForm.status === 'VALIDATED' ? (editing?.validation_date ?? nowIso) : null,
    };
  };

  const handleSave = async () => {
    if (saving) return;
    if (!form.asset_id || !form.description) { toast.error('Asset e descrizione sono obbligatori'); return; }
    if (editing && (editing.status === 'VALIDATED' || editing.status === 'ABANDONED') && form.status !== editing.status) {
      toast.error('Non puoi modificare lo stato di un ordine di lavoro finale');
      return;
    }
    if ((form.status === 'CLOSED' || form.status === 'VALIDATED') && !form.executed_at) {
      toast.error('Per chiudere o validare un intervento serve la data intervento');
      return;
    }
    setSaving(true);
    const saveStartedAt = Date.now();
    try {
      const payload = buildWorkOrderPayload(form);
      const result = editing
        ? await updateWorkOrder(editing.id, payload)
        : await createWorkOrder(payload);

      const { error } = result;
      const data = 'data' in result ? result.data : null;

      if (error) {
        toast.error(error.message ?? 'Errore nel salvataggio');
        return;
      }

      if (!editing && ticketDraft && data) {
        const ticketUpdatePayload = {
          status: 'IN_PROGRESS',
          work_order_id: (data as any).id,
          asset_id: form.asset_id || null,
        };

        const { error: ticketLinkError } = await runResilientRequest(
          (signal) => supabase.from('tickets').update(ticketUpdatePayload).eq('id', ticketDraft.id).abortSignal(signal),
          {
            label: 'ticket to work order link',
            timeoutMessage: 'Timeout durante il collegamento del ticket al WO',
          }
        );

        if (ticketLinkError) {
          toast.error((ticketLinkError as any).message ?? 'WO creato, ma il ticket non è stato collegato correttamente');
          return;
        }
      }

      toast.success(editing ? 'Ordine di lavoro aggiornato' : 'Ordine di lavoro creato');
      setTicketDraft(null);
      await waitForSaveFeedback(saveStartedAt);
      setSaving(false);
      await waitForSaveSuccessFeedback();
      setModalOpen(false);
    } catch (error) {
      console.error('Work order save failed', error);
      const message = error instanceof Error ? error.message : 'Errore nel salvataggio del WO';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleAdvanceStatus = async (workOrder: WorkOrder) => {
    if (workOrder.status === 'VALIDATED' || workOrder.status === 'ABANDONED') {
      toast.info('Questo ordine di lavoro e in uno stato finale');
      return;
    }

    const nextStatus = NEXT_STATUS_MAP[workOrder.status];

    if (!nextStatus) {
      toast.info('Questo ordine di lavoro e gia all\'ultimo stato disponibile');
      return;
    }

    const today = new Date().toISOString();
    const payload: Partial<WorkOrder> = {
      status: nextStatus,
    };

    if (nextStatus === 'CLOSED') {
      payload.executed_at = workOrder.executed_at ?? today;
      payload.closed_at = workOrder.closed_at ?? today;
    }

    if (nextStatus === 'VALIDATED') {
      payload.executed_at = workOrder.executed_at ?? today;
      payload.closed_at = workOrder.closed_at ?? today;
      payload.validation_date = workOrder.validation_date ?? today;
    }

    const { error } = await updateWorkOrder(workOrder.id, payload);

    if (error) {
      toast.error(error.message ?? error.details ?? 'Errore nell avanzamento dello stato');
      return;
    }

    toast.success(`Stato aggiornato a ${STATUS_LABELS[nextStatus]}`);
  };

  const handleSuspendStatus = async (workOrder: WorkOrder) => {
    if (workOrder.status === 'SUSPENDED') {
      toast.info('Questo ordine di lavoro e gia sospeso');
      return;
    }

    if (workOrder.status === 'CLOSED' || workOrder.status === 'VALIDATED' || workOrder.status === 'ABANDONED') {
      toast.info('Non puoi sospendere un ordine di lavoro chiuso o validato');
      return;
    }

    const { error } = await updateWorkOrder(workOrder.id, { status: 'SUSPENDED' });

    if (error) {
      toast.error(error.message ?? error.details ?? 'Errore nella sospensione');
      return;
    }

    toast.success('Ordine di lavoro sospeso');
  };

  const handleAbandonStatus = async (workOrder: WorkOrder) => {
    if (workOrder.status === 'ABANDONED') {
      toast.info('Questo ordine di lavoro e gia abbandonato');
      return;
    }

    if (workOrder.status === 'VALIDATED') {
      toast.info('Non puoi abbandonare un ordine di lavoro validato');
      return;
    }

    const { error } = await updateWorkOrder(workOrder.id, { status: 'ABANDONED' });

    if (error) {
      toast.error(error.message ?? error.details ?? 'Errore nell abbandono');
      return;
    }

    toast.success('Ordine di lavoro abbandonato');
  };

  const handleDelete = async (workOrder: WorkOrder) => {
    if (!isAdmin) {
      toast.error('Solo un admin puo eliminare un ordine di lavoro');
      return;
    }

    const confirmed = window.confirm(`Vuoi eliminare definitivamente ${workOrder.code}?`);
    if (!confirmed) return;

    const { error } = await deleteWorkOrder(workOrder.id);

    if (error) {
      toast.error(error.message ?? error.details ?? 'Errore nell eliminazione');
      return;
    }

    toast.success('Ordine di lavoro eliminato');
    if (editing?.id === workOrder.id) {
      setModalOpen(false);
    }
  };

  const handleTimelineStatusChange = (nextStatus: WorkOrderStatus) => {
    if (!editing) return;
    if (editing.status === 'VALIDATED' || editing.status === 'ABANDONED') return;
    if (form.status === 'VALIDATED' || form.status === 'ABANDONED') return;

    if (nextStatus === 'SUSPENDED') {
      setForm((current) => ({ ...current, status: 'SUSPENDED' }));
      return;
    }

    if (nextStatus === 'ABANDONED') {
      setForm((current) => ({ ...current, status: 'ABANDONED' }));
      return;
    }

    const nextForm = {
      ...form,
      status: nextStatus,
      executed_at: (nextStatus === 'CLOSED' || nextStatus === 'VALIDATED') && !form.executed_at
        ? new Date().toISOString().slice(0, 10)
        : form.executed_at,
    };

    setForm(nextForm);
  };

  const totalOrders = workOrders.length;
  const inProgressCount = workOrders.filter(wo => wo.status === 'IN_PROGRESS').length;
  const plannedCount = workOrders.filter(wo => wo.status === 'PLANNED').length;
  const closedCount = workOrders.filter(wo => wo.status === 'CLOSED').length;

  return (
    <div className="space-y-5">
      {/* Header + toolbar unificato */}
      <div className="overflow-hidden rounded-xl border border-[#E5E4DF] bg-white shadow-sm">
        {/* Top: overview + KPI + azione */}
        <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Sinistra: titolo + desc */}
          <div className="min-w-0 space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Overview operativa</p>
            <p className="text-xl font-bold tracking-tight text-slate-950">
              {totalOrders} {totalOrders === 1 ? 'ordine di lavoro' : 'ordini di lavoro'}
            </p>
            <p className="text-xs text-slate-400">Monitoraggio interventi e avanzamento operativo</p>
          </div>
          {/* Centro: KPI pills */}
          <div className="flex flex-wrap gap-2 lg:justify-center">
            <div className="flex items-center gap-2 rounded-lg border border-[#E5E4DF] bg-[#FAFAF9] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-slate-700">{inProgressCount}</span>
              <span className="text-xs text-slate-500">In corso</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[#E5E4DF] bg-[#FAFAF9] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              <span className="text-xs font-bold text-slate-700">{plannedCount}</span>
              <span className="text-xs text-slate-500">Pianificati</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[#E5E4DF] bg-[#FAFAF9] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-700">{closedCount}</span>
              <span className="text-xs text-slate-500">Chiusi</span>
            </div>
          </div>
          {/* Destra: azione */}
          <Button className="h-10 shrink-0 rounded-lg bg-[#2ECC71] px-6 font-bold shadow-lg shadow-primary/20 gap-2 hover:bg-[#27B463]" onClick={openCreate}>
            <Plus size={18} /> Nuovo Ordine di Lavoro
          </Button>
        </div>
        {/* Divider */}
        <div className="border-t border-[#E5E4DF]" />
        {/* Bottom: toolbar */}
        <div className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888780]" size={16} />
            <Input
              placeholder="Cerca intervento..."
              className="h-10 rounded-lg border border-[#E5E4DF] bg-[#FAFAF9] pl-9 text-sm shadow-none dark:bg-slate-900/80"
              value={searchValue}
              onChange={(e) => {
                const nextValue = e.target.value;
                setSearch(nextValue);
                onGlobalSearchChange?.(nextValue);
              }}
            />
          </div>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as WorkOrderStatus | 'ALL')}>
            <SelectTrigger className="h-10 w-44 rounded-lg border border-[#E5E4DF] bg-[#FAFAF9] text-sm shadow-none dark:bg-slate-900/80">
              <SelectValue placeholder="Tutti gli stati" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="ALL">Tutti gli stati</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
          {filtered.length === 0 && (
            <div className="arena-card col-span-full text-center py-16 text-slate-400">Nessun ordine di lavoro trovato</div>
          )}
          {filtered.map((wo) => {
            const technicianName = wo.technician?.name ?? 'Non assegnato';
            const nextStatus = NEXT_STATUS_MAP[wo.status];
            const canAdvance = Boolean(nextStatus) && wo.status !== 'VALIDATED' && wo.status !== 'ABANDONED';
            const canCloseDirectly = wo.status !== 'CLOSED' && wo.status !== 'VALIDATED' && wo.status !== 'ABANDONED';

            return (
              <Card
                key={wo.id}
                className="arena-card group cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
                onClick={() => openEdit(wo)}
              >
                <CardContent className="flex h-full min-h-72 flex-col p-6">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <span className="font-mono text-sm font-semibold tracking-[0.14em] text-slate-500">
                      {wo.code ?? wo.id.slice(0, 8).toUpperCase()}
                    </span>
                    <PriorityBadge priority={wo.priority} />
                  </div>

                  <div className="min-h-24">
                    <h3 className="line-clamp-2 text-xl font-bold leading-tight text-slate-950">
                      {getWorkOrderTitle(wo)}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-500">
                      {getAssetSubtitle(wo)}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-700 to-cyan-500 text-xs font-bold text-white shadow-sm">
                        {getInitials(technicianName)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-700">{technicianName}</p>
                        <p className="text-xs text-slate-500">
                          Creato {format(new Date(wo.created_at), 'd MMM · HH:mm', { locale: it })}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={wo.status} />
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
                    <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-500">
                      {wo.planned_date ? (
                        <>
                          <Clock size={14} />
                          <span className="truncate">{format(new Date(wo.planned_date), 'd MMM yyyy', { locale: it })}</span>
                        </>
                      ) : (
                        <span className="truncate">{TYPE_LABELS[wo.type]}</span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 rounded-lg px-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEdit(wo);
                      }}
                    >
                      Apri scheda
                      <ChevronRight size={15} />
                    </Button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="h-10 rounded-lg bg-primary px-5 font-bold shadow-lg shadow-primary/15 hover:bg-primary/90"
                      disabled={!canAdvance}
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleAdvanceStatus(wo);
                      }}
                    >
                      {getPrimaryActionLabel(wo.status)}
                    </Button>
                    {canCloseDirectly && wo.status !== 'IN_PROGRESS' && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-10 rounded-lg px-5 font-bold text-slate-700 hover:bg-slate-100"
                        onClick={(event) => {
                          event.stopPropagation();
                          void updateWorkOrder(wo.id, {
                            status: 'CLOSED',
                            executed_at: wo.executed_at ?? new Date().toISOString(),
                            closed_at: wo.closed_at ?? new Date().toISOString(),
                          });
                        }}
                      >
                        Chiudi
                      </Button>
                    )}
                    {wo.status !== 'SUSPENDED' && wo.status !== 'CLOSED' && wo.status !== 'VALIDATED' && wo.status !== 'ABANDONED' && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-10 rounded-lg px-4 font-bold text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleSuspendStatus(wo);
                        }}
                      >
                        Sospendi
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="rounded-xl w-[min(96vw,1100px)] max-w-[1100px] sm:max-w-[1100px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifica Ordine di Lavoro' : 'Nuovo Ordine di Lavoro'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* Timeline */}
            {editing && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">Timeline Intervento</p>
                    <p className="text-xs text-slate-500">Clicca uno stato per aggiornare rapidamente il WO.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="h-9 rounded-lg border-red-200 bg-white font-semibold text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                      disabled={form.status === 'SUSPENDED' || form.status === 'CLOSED' || form.status === 'VALIDATED' || form.status === 'ABANDONED'}
                      onClick={() => handleTimelineStatusChange('SUSPENDED')}>
                      Sospendi
                    </Button>
                    <Button type="button" variant="outline" className="h-9 rounded-lg border-slate-300 bg-white font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      disabled={form.status === 'VALIDATED' || form.status === 'ABANDONED'}
                      onClick={() => handleTimelineStatusChange('ABANDONED')}>
                      Abbandona
                    </Button>
                    <Button type="button" variant="outline" className="h-9 rounded-lg border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      disabled={!NEXT_STATUS_MAP[form.status] || form.status === 'VALIDATED' || form.status === 'ABANDONED'}
                      onClick={() => handleTimelineStatusChange(NEXT_STATUS_MAP[form.status] as WorkOrderStatus)}>
                      {NEXT_STATUS_MAP[form.status] ? `Avanza a ${STATUS_LABELS[NEXT_STATUS_MAP[form.status] as WorkOrderStatus]}` : 'Flusso completato'}
                    </Button>
                  </div>
                </div>
                <WorkOrderTimeline status={form.status} interactive={!isTerminalStatus} onStepClick={handleTimelineStatusChange} />
              </div>
            )}

            {/* SEZ 1 — Intervento */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Intervento</p>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <div className="space-y-1">
                <Label>Asset *</Label>
                <Popover open={assetPopoverOpen} onOpenChange={setAssetPopoverOpen}>
                  <PopoverTrigger className="w-full">
                    <button type="button" className="flex h-12 w-full items-center justify-between rounded-lg border border-input bg-background px-4 text-left text-sm ring-offset-background transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <div className="min-w-0">
                        {selectedAsset ? (
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{selectedAsset.name}</p>
                            <p className="truncate text-xs text-slate-500">{[selectedAsset.serial_number, selectedAsset.location?.name].filter(Boolean).join(' • ')}</p>
                          </div>
                        ) : (
                          <span className="text-slate-500">Cerca e seleziona un asset...</span>
                        )}
                      </div>
                      <Search size={16} className="shrink-0 text-slate-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] rounded-xl p-3">
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input value={assetSearchQuery} onChange={(e) => setAssetSearchQuery(e.target.value)} placeholder="Cerca per nome, seriale, marca, modello o ubicazione..." className="h-11 rounded-xl pl-9" />
                      </div>
                      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                        {filteredAssets.length === 0 ? (
                          <p className="py-4 text-center text-sm text-slate-500">Nessun asset trovato</p>
                        ) : (
                          filteredAssets.map((asset) => (
                            <button key={asset.id} type="button"
                              onClick={() => { setForm({ ...form, asset_id: asset.id }); setAssetPopoverOpen(false); setAssetSearchQuery(''); }}
                              className={cn('w-full rounded-xl border px-3 py-2 text-left transition-colors', form.asset_id === asset.id ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/40 hover:bg-slate-50')}>
                              <p className="truncate text-sm font-semibold text-slate-900">{asset.name}</p>
                              <p className="truncate text-xs text-slate-500">{[asset.serial_number, asset.brand, asset.model, asset.location?.name].filter(Boolean).join(' • ')}</p>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as WorkOrderType })}>
                    <SelectTrigger className="w-full rounded-xl"><span className="truncate">{TYPE_LABELS[form.type]}</span></SelectTrigger>
                    <SelectContent className="rounded-xl">{TYPES.map((t) => <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Priorità</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}>
                    <SelectTrigger className="w-full rounded-xl"><span className="truncate">{PRIORITY_TRANSLATIONS[form.priority]}</span></SelectTrigger>
                    <SelectContent className="rounded-xl">{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{PRIORITY_TRANSLATIONS[p]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Stato</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as WorkOrderStatus })}>
                    <SelectTrigger className="w-full rounded-xl" disabled={isTerminalStatus}><span className="truncate">{STATUS_LABELS[form.status]}</span></SelectTrigger>
                    <SelectContent className="rounded-xl">{STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Descrizione *</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl min-h-20" rows={3} />
              </div>
            </div>

            {/* SEZ 2 — Date */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Date</p>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Data concordata con il fornitore</Label>
                  <Input type="date" value={form.planned_date} onChange={(e) => setForm({ ...form, planned_date: e.target.value })} className="rounded-xl" />
                  <p className="text-xs text-slate-400">La data in cui hai fissato l'intervento</p>
                </div>
                <div className="space-y-1">
                  <Label>Data esecuzione effettiva</Label>
                  <Input type="date" value={form.executed_at} onChange={(e) => setForm({ ...form, executed_at: e.target.value })} className="rounded-xl" />
                  <p className="text-xs text-slate-400">Obbligatoria per chiudere il WO · la prossima scadenza sarà calcolata da questa data</p>
                </div>
              </div>
            </div>

            {/* SEZ 3 — Tecnico, Fornitore, Costi */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Tecnico, Fornitore e Costi</p>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Tecnico</Label>
                  <Select value={form.technician_id} onValueChange={(v) => setForm({ ...form, technician_id: v })}>
                    <SelectTrigger className="w-full rounded-xl">
                      <span className="truncate text-left">
                        {selectedTechnician ? `${selectedTechnician.name}${selectedTechnician.supplier?.name ? ` • ${selectedTechnician.supplier.name}` : ''}` : 'Nessuno'}
                      </span>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="">Nessuno</SelectItem>
                      {technicians.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name} • {TECHNICIAN_EMPLOYMENT_LABELS[t.employment_type]}{t.supplier?.name ? ` • ${t.supplier.name}` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Fornitore</Label>
                  <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })} disabled={technicianIsExternal}>
                    <SelectTrigger className="w-full rounded-xl">
                      <span className="truncate text-left">{selectedSupplier?.name ?? 'Nessuno'}</span>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="">Nessuno</SelectItem>
                      {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {selectedTechnician && (
                    <p className="text-xs text-slate-500">
                      {selectedTechnician.employment_type === 'EXTERNAL'
                        ? `Fornitore collegato automaticamente: ${selectedTechnician.supplier?.name ?? 'non impostato'}`
                        : 'Tecnico interno di Pallacanestro Varese'}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Costo (€)</Label>
                  <Input type="number" min={0} step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="rounded-xl" placeholder="0.00" />
                </div>
                <div className="col-span-2 space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="report_delivered"
                        checked={form.report_delivered}
                        onCheckedChange={(v) => setForm((f) => ({ ...f, report_delivered: !!v }))}
                      />
                      <label htmlFor="report_delivered" className="text-sm font-semibold text-slate-700 cursor-pointer flex items-center gap-2">
                        <FileCheck size={14} className="text-slate-500" />
                        Rapportino di intervento consegnato
                      </label>
                    </div>
                    {editing ? (
                      <label className={cn('flex items-center gap-2 cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold border transition-colors', uploading ? 'opacity-50 pointer-events-none' : 'border-primary/30 text-primary hover:bg-primary/5')}>
                        {uploading ? <Loader2 size={13} className="animate-spin" /> : <Paperclip size={13} />}
                        {uploading ? 'Caricamento...' : 'Allega file'}
                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileUpload} disabled={uploading} />
                      </label>
                    ) : (
                      <p className="text-xs text-slate-400">Salva il WO per allegare file</p>
                    )}
                  </div>
                  {reportFiles.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-slate-200">
                      {reportFiles.map((path) => (
                        <div key={path} className="flex items-center gap-2 rounded-lg bg-white border border-slate-100 px-3 py-2">
                          <Paperclip size={12} className="text-slate-400 shrink-0" />
                          <span className="text-xs font-medium text-slate-700 flex-1 truncate">{fileNameFromPath(path)}</span>
                          <button onClick={() => handleFileDownload(path)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-colors" title="Scarica">
                            <Download size={13} />
                          </button>
                          <button onClick={() => handleFileDelete(path)} className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Rimuovi">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {reportFiles.length === 0 && editing && (
                    <p className="text-xs text-slate-400 pt-1 border-t border-slate-200">Nessun file allegato · formati accettati: PDF, JPG, PNG</p>
                  )}
                </div>
              </div>
            </div>

            {/* SEZ 4 — Note */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Note</p>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl min-h-20" rows={3} placeholder="Annotazioni aggiuntive sull'intervento..." />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editing && isAdmin && (
              <Button variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50" onClick={() => void handleDelete(editing)}>
                Elimina
              </Button>
            )}
            <Button variant="outline" className="rounded-xl" onClick={() => setModalOpen(false)}>Annulla</Button>
            <AnimatedSaveButton onClick={handleSave} isSaving={saving} idleLabel="Salva" />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
