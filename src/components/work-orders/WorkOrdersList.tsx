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
    status === 'IN_PROGRESS' ? 'bg-[#1C1B18] text-[#FAFAF9]' :
    status === 'VALIDATED'   ? 'bg-[#1A7A3C] text-white' :
    status === 'CLOSED'      ? 'bg-[#EAFBF1] text-[#1A7A3C]' :
    status === 'ASSIGNED'    ? 'bg-[#EAFBF1] text-[#1A7A3C]' :
    status === 'SUSPENDED'   ? 'bg-[#FFF0EE] text-[#A83228]' :
    status === 'ABANDONED'   ? 'bg-[#F1EFE8] text-[#5F5E5A]' :
    status === 'PLANNED'     ? 'bg-[#FFF3E8] text-[#A8531A]' :
    'bg-[#F1EFE8] text-[#5F5E5A]';
  return (
    <Badge className={cn(cls, 'gap-1 border-none rounded-md px-2 py-[3px] font-semibold text-[11px] uppercase tracking-[0.04em]')}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const cls =
    priority === 'CRITICAL' ? 'bg-[#A83228] text-white' :
    priority === 'HIGH'     ? 'bg-[#FFF0EE] text-[#A83228]' :
    priority === 'MEDIUM'   ? 'bg-[#FFF3E8] text-[#A8531A]' :
    'bg-[#F1EFE8] text-[#5F5E5A]';

  return (
    <Badge className={cn(cls, 'gap-1 border-none rounded-md px-2 py-[3px] font-semibold text-[11px] uppercase tracking-[0.04em]')}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {PRIORITY_TRANSLATIONS[priority]}
    </Badge>
  );
}

function getPriorityBorderColor(priority: Priority): string {
  if (priority === 'CRITICAL') return '#A83228';
  if (priority === 'HIGH') return '#E24B4A';
  if (priority === 'MEDIUM') return '#E8782A';
  return '#D3D1C7';
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
    <div className="space-y-3">
      <div className="flex w-full items-center overflow-x-auto pb-1">
        {STATUS_FLOW.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = step === status || (status === 'SUSPENDED' && step === 'IN_PROGRESS');

          return (
            <React.Fragment key={step}>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  disabled={!interactive || !onStepClick}
                  onClick={() => onStepClick?.(step)}
                  className={cn(
                    'flex h-7 min-w-7 items-center justify-center rounded-full border text-[10px] font-bold transition-all',
                    interactive && onStepClick ? 'cursor-pointer hover:scale-105' : 'cursor-default',
                    isCurrent
                      ? status === 'SUSPENDED'
                        ? 'border-[#FFF0EE] bg-[#FFF0EE] text-[#A83228] ring-2 ring-[#FFF0EE] ring-offset-1'
                        : 'border-[#2ECC71] bg-[#2ECC71] text-white ring-2 ring-[#2ECC71]/25 ring-offset-1'
                      : isCompleted
                        ? 'border-[#EAFBF1] bg-[#EAFBF1] text-[#1A7A3C]'
                        : 'border-[#E5E4DF] bg-white text-[#888780]'
                  )}
                >
                  {index + 1}
                </button>
                <span className={cn(
                  'text-[11px] whitespace-nowrap',
                  isCurrent
                    ? status === 'SUSPENDED' ? 'font-bold text-[#A83228]' : 'font-bold text-[#1C1B18]'
                    : isCompleted ? 'font-semibold text-[#1A7A3C]' : 'font-medium text-[#888780]'
                )}>
                  {STATUS_LABELS[step]}
                </span>
              </div>
              {index < STATUS_FLOW.length - 1 && (
                <div className={cn('h-px min-w-8 flex-1', index < currentIndex ? 'bg-[#2ECC71]' : 'bg-[#E5E4DF]')} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      {status === 'SUSPENDED' && (
        <p className="text-[11px] font-medium text-[#A83228]">Intervento sospeso — puoi riprenderlo riportandolo In corso.</p>
      )}
      {status === 'ABANDONED' && (
        <p className="text-[11px] font-medium text-[#5F5E5A]">Intervento abbandonato: stato finale, non modificabile.</p>
      )}
      {status === 'VALIDATED' && (
        <p className="text-[11px] font-medium text-[#1A7A3C]">Intervento validato: stato finale, non modificabile.</p>
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
      <div className="overflow-hidden rounded-xl border border-[#E5E4DF] bg-white">
        {/* Top: overview + KPI + azione */}
        <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Sinistra: titolo + desc */}
          <div className="min-w-0 space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#888780]">Overview operativa</p>
            <p className="text-xl font-bold tracking-tight text-[#1C1B18]">
              {totalOrders} {totalOrders === 1 ? 'ordine di lavoro' : 'ordini di lavoro'}
            </p>
            <p className="text-xs text-[#888780]">Monitoraggio interventi e avanzamento operativo</p>
          </div>
          {/* Centro: KPI pills */}
          <div className="flex flex-wrap gap-2 lg:justify-center">
            <div className="flex items-center gap-2 rounded-lg border border-[#E5E4DF] bg-[#FAFAF9] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2ECC71]" />
              <span className="text-xs font-bold text-[#1C1B18]">{inProgressCount}</span>
              <span className="text-xs text-[#888780]">In corso</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[#E5E4DF] bg-[#FAFAF9] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E8782A]" />
              <span className="text-xs font-bold text-[#1C1B18]">{plannedCount}</span>
              <span className="text-xs text-[#888780]">Pianificati</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-[#E5E4DF] bg-[#FAFAF9] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1A7A3C]" />
              <span className="text-xs font-bold text-[#1C1B18]">{closedCount}</span>
              <span className="text-xs text-[#888780]">Chiusi</span>
            </div>
          </div>
          {/* Destra: azione */}
          <Button className="h-10 shrink-0 rounded-lg bg-[#2ECC71] px-6 font-bold gap-2 hover:bg-[#27B463] text-[#0A3D1F]" onClick={openCreate}>
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
              className="h-10 rounded-lg border border-[#E5E4DF] bg-[#FAFAF9] pl-9 text-sm shadow-none"
              value={searchValue}
              onChange={(e) => {
                const nextValue = e.target.value;
                setSearch(nextValue);
                onGlobalSearchChange?.(nextValue);
              }}
            />
          </div>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as WorkOrderStatus | 'ALL')}>
            <SelectTrigger className="h-10 w-44 rounded-lg border border-[#E5E4DF] bg-[#FAFAF9] text-sm shadow-none">
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
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#2ECC71] border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
          {filtered.length === 0 && (
            <div className="col-span-full rounded-xl border border-[#E5E4DF] bg-white py-16 text-center text-sm text-[#888780]">Nessun ordine di lavoro trovato</div>
          )}
          {filtered.map((wo) => {
            const technicianName = wo.technician?.name ?? 'Non assegnato';
            const nextStatus = NEXT_STATUS_MAP[wo.status];
            const canAdvance = Boolean(nextStatus) && wo.status !== 'VALIDATED' && wo.status !== 'ABANDONED';
            const canCloseDirectly = wo.status !== 'CLOSED' && wo.status !== 'VALIDATED' && wo.status !== 'ABANDONED';

            return (
              <Card
                key={wo.id}
                className="group cursor-pointer overflow-hidden rounded-[10px] border border-[#E5E4DF] bg-white transition-colors hover:border-[#D3D1C7] hover:shadow-sm"
                style={{ borderLeft: `3px solid ${getPriorityBorderColor(wo.priority)}` }}
                onClick={() => openEdit(wo)}
              >
                <CardContent className="p-0">
                  {/* Header: codice + priorità */}
                  <div className="flex items-center justify-between border-b border-[#F1EFE8] px-5 py-3">
                    <span className="tabular-nums text-xs font-semibold tracking-wide text-[#5F5E5A]">
                      {wo.code ?? wo.id.slice(0, 8).toUpperCase()}
                    </span>
                    <PriorityBadge priority={wo.priority} />
                  </div>

                  {/* Body: titolo + asset + assegnatario + stato */}
                  <div className="space-y-3 px-5 py-4">
                    <div>
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[#1C1B18]">
                        {getWorkOrderTitle(wo)}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-xs text-[#888780]">
                        {getAssetSubtitle(wo)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1C1B18] text-[10px] font-bold text-[#FAFAF9]">
                          {getInitials(technicianName)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[#1C1B18]">{technicianName}</p>
                          <p className="tabular-nums text-[11px] text-[#888780]">
                            {format(new Date(wo.created_at), 'd MMM · HH:mm', { locale: it })}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={wo.status} />
                    </div>
                  </div>

                  {/* Date row */}
                  <div className="flex items-center justify-between border-t border-[#E5E4DF] px-5 py-3">
                    <div className="flex min-w-0 items-center gap-1.5 text-xs text-[#5F5E5A]">
                      {wo.planned_date ? (
                        <>
                          <Clock size={13} className="shrink-0 text-[#888780]" />
                          <span className="tabular-nums truncate">{format(new Date(wo.planned_date), 'd MMM yyyy', { locale: it })}</span>
                        </>
                      ) : (
                        <span className="text-[#888780]">{TYPE_LABELS[wo.type]}</span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-7 gap-0.5 rounded-md px-2 text-xs font-semibold text-[#5F5E5A] hover:bg-[#F1EFE8] hover:text-[#1C1B18]"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEdit(wo);
                      }}
                    >
                      Apri scheda
                      <ChevronRight size={13} />
                    </Button>
                  </div>

                  {/* Footer azioni */}
                  <div className="flex flex-wrap items-center gap-2 border-t border-[#E5E4DF] bg-[#FAFAF9] px-5 py-3">
                    <Button
                      type="button"
                      className="h-8 rounded-md bg-[#2ECC71] px-4 text-xs font-semibold text-[#0A3D1F] shadow-none hover:bg-[#27B463]"
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
                        className="h-8 rounded-md px-4 text-xs font-semibold text-[#5F5E5A] hover:bg-[#E5E4DF] hover:text-[#1C1B18]"
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
                        className="h-8 rounded-md px-3 text-xs font-semibold text-[#A83228] hover:bg-[#FFF0EE] hover:text-[#A83228]"
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
        <DialogContent className="w-[min(92vw,1040px)] max-w-none sm:max-w-none p-0 overflow-hidden rounded-xl flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="shrink-0 border-b border-[#E5E4DF] bg-white px-8 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-[15px] font-bold tracking-tight text-[#1C1B18]">
                  {editing ? 'Modifica Ordine di Lavoro' : 'Nuovo Ordine di Lavoro'}
                </DialogTitle>
                <p className="mt-0.5 text-xs text-[#888780]">
                  {editing ? "Aggiorna i dati dell'ordine di lavoro" : "Compila i campi per pianificare l'intervento"}
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[68vh] overflow-y-auto bg-[#FAFAF9] px-8 py-6 space-y-4">

            {/* Timeline intervento (solo modifica) */}
            {editing && (
              <div className="overflow-hidden rounded-xl border border-[#E5E4DF] bg-white">
                {/* Header */}
                <div className="flex flex-col gap-3 border-b border-[#E5E4DF] bg-[#FAFAF9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#1C1B18]">Timeline intervento</h3>
                      {editing.code && (
                        <span className="tabular-nums rounded bg-[#F1EFE8] px-1.5 py-0.5 text-[11px] font-semibold text-[#5F5E5A]">
                          {editing.code}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-[#888780]">Gestisci l'avanzamento operativo — clicca uno step per aggiornare</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="button" variant="outline"
                        className="inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#F4C7C3] bg-[#FFF0EE] px-3 text-xs font-bold text-[#A83228] transition-colors hover:bg-[#FFE7E4] disabled:opacity-40"
                        disabled={form.status === 'SUSPENDED' || form.status === 'CLOSED' || form.status === 'VALIDATED' || form.status === 'ABANDONED'}
                        onClick={() => handleTimelineStatusChange('SUSPENDED')}>
                        Sospendi
                      </Button>
                      <Button type="button" variant="outline"
                        className="inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#D3D1C7] bg-white px-3 text-xs font-bold text-[#5F5E5A] transition-colors hover:bg-[#FAFAF9] disabled:opacity-40"
                        disabled={form.status === 'VALIDATED' || form.status === 'ABANDONED'}
                        onClick={() => handleTimelineStatusChange('ABANDONED')}>
                        Abbandona
                      </Button>
                      <Button type="button" variant="outline"
                        className="inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#1C1B18] bg-[#1C1B18] px-3 text-xs font-bold text-[#FAFAF9] transition-colors hover:bg-[#2A2925] disabled:opacity-40"
                        disabled={!NEXT_STATUS_MAP[form.status] || form.status === 'VALIDATED' || form.status === 'ABANDONED'}
                        onClick={() => handleTimelineStatusChange(NEXT_STATUS_MAP[form.status] as WorkOrderStatus)}>
                        {NEXT_STATUS_MAP[form.status] ? `Avanza → ${STATUS_LABELS[NEXT_STATUS_MAP[form.status] as WorkOrderStatus]}` : 'Flusso completato'}
                      </Button>
                    </div>
                  </div>
                </div>
                {/* Body */}
                <div className="px-5 py-5">
                  <WorkOrderTimeline status={form.status} interactive={!isTerminalStatus} onStepClick={handleTimelineStatusChange} />
                </div>
              </div>
            )}

            {/* Grid asimmetrico: sinistra più larga */}
            <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-5 items-start">

              {/* Colonna sinistra: Intervento + Rapportino */}
              <div className="space-y-4">

                {/* Intervento */}
                <div className="rounded-xl border border-[#E5E4DF] bg-white p-5 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#888780]">Intervento</p>

                  {/* Asset selector premium */}
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold text-[#1C1B18]">Asset *</Label>
                    <Popover open={assetPopoverOpen} onOpenChange={setAssetPopoverOpen}>
                      <PopoverTrigger className="w-full">
                        <button type="button" className={cn(
                          'flex w-full items-center justify-between rounded-xl border bg-white px-4 text-left transition-colors hover:border-[#D3D1C7] hover:bg-[#FAFAF9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2ECC71] focus-visible:ring-offset-2',
                          selectedAsset ? 'h-14 border-[#E5E4DF]' : 'h-10 border-[#E5E4DF]'
                        )}>
                          <div className="min-w-0 flex-1">
                            {selectedAsset ? (
                              <>
                                <p className="truncate text-sm font-semibold text-[#1C1B18]">{selectedAsset.name}</p>
                                <p className="truncate text-xs text-[#888780]">{[selectedAsset.serial_number, selectedAsset.location?.name].filter(Boolean).join(' • ')}</p>
                              </>
                            ) : (
                              <span className="text-sm text-[#888780]">Cerca e seleziona un asset...</span>
                            )}
                          </div>
                          <Search size={15} className="ml-3 shrink-0 text-[#888780]" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] rounded-xl border border-[#E5E4DF] p-3 shadow-sm">
                        <div className="space-y-2.5">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888780]" size={15} />
                            <Input value={assetSearchQuery} onChange={(e) => setAssetSearchQuery(e.target.value)} placeholder="Cerca per nome, seriale, marca, modello o ubicazione..." className="h-9 rounded-lg border-[#E5E4DF] pl-9 text-sm" />
                          </div>
                          <div className="max-h-60 space-y-1 overflow-y-auto pr-1">
                            {filteredAssets.length === 0 ? (
                              <p className="py-4 text-center text-sm text-[#888780]">Nessun asset trovato</p>
                            ) : (
                              filteredAssets.map((asset) => (
                                <button key={asset.id} type="button"
                                  onClick={() => { setForm({ ...form, asset_id: asset.id }); setAssetPopoverOpen(false); setAssetSearchQuery(''); }}
                                  className={cn('w-full rounded-lg border px-3 py-2 text-left transition-colors', form.asset_id === asset.id ? 'border-[#2ECC71] bg-[#EAFBF1]' : 'border-[#E5E4DF] hover:border-[#D3D1C7] hover:bg-[#FAFAF9]')}>
                                  <p className="truncate text-sm font-semibold text-[#1C1B18]">{asset.name}</p>
                                  <p className="truncate text-xs text-[#888780]">{[asset.serial_number, asset.brand, asset.model, asset.location?.name].filter(Boolean).join(' • ')}</p>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Descrizione */}
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold text-[#1C1B18]">Descrizione *</Label>
                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-[96px] rounded-lg border-[#E5E4DF] text-sm" rows={4} placeholder="Descrivi l'intervento da svolgere..." />
                  </div>

                  {/* Tipo + Priorità + Stato */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold text-[#1C1B18]">Tipo</Label>
                      <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as WorkOrderType })}>
                        <SelectTrigger className="h-10 w-full rounded-lg border-[#E5E4DF] text-sm"><span className="truncate">{TYPE_LABELS[form.type]}</span></SelectTrigger>
                        <SelectContent className="rounded-lg">{TYPES.map((t) => <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold text-[#1C1B18]">Priorità</Label>
                      <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Priority })}>
                        <SelectTrigger className="h-10 w-full rounded-lg border-[#E5E4DF] text-sm"><span className="truncate">{PRIORITY_TRANSLATIONS[form.priority]}</span></SelectTrigger>
                        <SelectContent className="rounded-lg">{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{PRIORITY_TRANSLATIONS[p]}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold text-[#1C1B18]">Stato</Label>
                      <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as WorkOrderStatus })}>
                        <SelectTrigger className="h-10 w-full rounded-lg border-[#E5E4DF] text-sm" disabled={isTerminalStatus}><span className="truncate">{STATUS_LABELS[form.status]}</span></SelectTrigger>
                        <SelectContent className="rounded-lg">{STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Rapportino */}
                <div className="rounded-xl border border-[#E5E4DF] bg-white p-5 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#888780]">Rapportino</p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Checkbox
                        id="report_delivered"
                        checked={form.report_delivered}
                        onCheckedChange={(v) => setForm((f) => ({ ...f, report_delivered: !!v }))}
                      />
                      <label htmlFor="report_delivered" className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-[#1C1B18]">
                        <FileCheck size={13} className="text-[#888780]" />
                        Consegnato
                      </label>
                    </div>
                    {editing ? (
                      <label className={cn('flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors', uploading ? 'pointer-events-none opacity-50' : 'border-[#E5E4DF] text-[#5F5E5A] hover:bg-[#F1EFE8]')}>
                        {uploading ? <Loader2 size={12} className="animate-spin" /> : <Paperclip size={12} />}
                        {uploading ? 'Caricamento...' : 'Allega file'}
                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileUpload} disabled={uploading} />
                      </label>
                    ) : (
                      <p className="text-xs text-[#888780]">Salva prima di allegare</p>
                    )}
                  </div>
                  {reportFiles.length > 0 && (
                    <div className="space-y-1 border-t border-[#E5E4DF] pt-2">
                      {reportFiles.map((path) => (
                        <div key={path} className="flex items-center gap-2 rounded-lg border border-[#E5E4DF] bg-[#FAFAF9] px-2.5 py-1.5">
                          <Paperclip size={11} className="shrink-0 text-[#888780]" />
                          <span className="flex-1 truncate text-xs font-medium text-[#1C1B18]">{fileNameFromPath(path)}</span>
                          <button onClick={() => handleFileDownload(path)} className="rounded p-1 text-[#888780] transition-colors hover:bg-[#F1EFE8] hover:text-[#1C1B18]" title="Scarica">
                            <Download size={12} />
                          </button>
                          <button onClick={() => handleFileDelete(path)} className="rounded p-1 text-[#888780] transition-colors hover:bg-[#FFF0EE] hover:text-[#A83228]" title="Rimuovi">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {reportFiles.length === 0 && editing && (
                    <p className="border-t border-[#E5E4DF] pt-2 text-xs text-[#888780]">Nessun allegato · PDF, JPG, PNG</p>
                  )}
                </div>

              </div>

              {/* Colonna destra: Pianificazione + Assegnazione e costi */}
              <div className="space-y-4">

                {/* Pianificazione */}
                <div className="rounded-xl border border-[#E5E4DF] bg-white p-5 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#888780]">Pianificazione</p>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold text-[#1C1B18]">Data concordata</Label>
                    <Input type="date" value={form.planned_date} onChange={(e) => setForm({ ...form, planned_date: e.target.value })} className="h-10 rounded-lg border-[#E5E4DF] text-sm" />
                    <p className="text-[11px] text-[#888780]">La data in cui hai fissato l'intervento</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold text-[#1C1B18]">Data esecuzione</Label>
                    <Input type="date" value={form.executed_at} onChange={(e) => setForm({ ...form, executed_at: e.target.value })} className="h-10 rounded-lg border-[#E5E4DF] text-sm" />
                    <p className="text-[11px] text-[#888780]">Obbligatoria per chiudere il WO</p>
                  </div>
                </div>

                {/* Assegnazione e costi */}
                <div className="rounded-xl border border-[#E5E4DF] bg-white p-5 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#888780]">Assegnazione e costi</p>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold text-[#1C1B18]">Tecnico</Label>
                    <Select value={form.technician_id} onValueChange={(v) => setForm({ ...form, technician_id: v })}>
                      <SelectTrigger className="h-10 w-full rounded-lg border-[#E5E4DF] text-sm">
                        <span className="truncate text-left">
                          {selectedTechnician ? `${selectedTechnician.name}${selectedTechnician.supplier?.name ? ` • ${selectedTechnician.supplier.name}` : ''}` : 'Nessuno'}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        <SelectItem value="">Nessuno</SelectItem>
                        {technicians.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name} • {TECHNICIAN_EMPLOYMENT_LABELS[t.employment_type]}{t.supplier?.name ? ` • ${t.supplier.name}` : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold text-[#1C1B18]">Fornitore</Label>
                    <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })} disabled={technicianIsExternal}>
                      <SelectTrigger className="h-10 w-full rounded-lg border-[#E5E4DF] text-sm">
                        <span className="truncate text-left">{selectedSupplier?.name ?? 'Nessuno'}</span>
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        <SelectItem value="">Nessuno</SelectItem>
                        {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {selectedTechnician && (
                      <p className="text-[11px] text-[#888780]">
                        {selectedTechnician.employment_type === 'EXTERNAL'
                          ? `Fornitore collegato automaticamente: ${selectedTechnician.supplier?.name ?? 'non impostato'}`
                          : 'Tecnico interno di Pallacanestro Varese'}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-semibold text-[#1C1B18]">Costo (€)</Label>
                    <Input type="number" min={0} step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="h-10 rounded-lg border-[#E5E4DF] text-sm" placeholder="0.00" />
                  </div>
                </div>

              </div>
            </div>

            {/* Note operative — full-width */}
            <div className="rounded-xl border border-[#E5E4DF] bg-white p-5 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#888780]">Note operative</p>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-[110px] w-full rounded-lg border-[#E5E4DF] text-sm" rows={4} placeholder="Annotazioni aggiuntive..." />
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between border-t border-[#E5E4DF] bg-white px-8 py-5">
            <p className="text-xs text-[#888780]">I campi con * sono obbligatori</p>
            <div className="flex items-center gap-3">
              {editing && isAdmin && (
                <Button variant="outline" className="h-9 rounded-lg border-[#FFF0EE] text-[#A83228] hover:bg-[#FFF0EE]" onClick={() => void handleDelete(editing)}>
                  Elimina
                </Button>
              )}
              <Button variant="outline" className="h-9 rounded-lg border-[#E5E4DF] text-[#1C1B18] hover:bg-[#F1EFE8]" onClick={() => setModalOpen(false)}>Annulla</Button>
              <AnimatedSaveButton onClick={handleSave} isSaving={saving} idleLabel={editing ? 'Salva modifiche' : 'Crea WO'} />
            </div>
          </div>

        </DialogContent>
      </Dialog>
    </div>
  );
}
