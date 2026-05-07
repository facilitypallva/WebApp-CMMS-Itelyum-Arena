import { useMemo, useState } from 'react';
import { Ticket, CheckCircle2, AlertCircle, MapPin, Paperclip, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTickets } from '@/hooks/useTickets';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  OPEN: {
    label: 'Aperto',
    stripBg: 'bg-[#FFF0EE]',
    stripIcon: 'text-[#E24B4A]',
    stripLabel: 'text-[#A83228]',
    dot: 'bg-[#E24B4A]',
  },
  IN_PROGRESS: {
    label: 'In Lavorazione',
    stripBg: 'bg-[#F1EFE8]',
    stripIcon: 'text-[#5F5E5A]',
    stripLabel: 'text-[#5F5E5A]',
    dot: 'bg-[#888780]',
  },
  CLOSED: {
    label: 'Chiuso',
    stripBg: 'bg-[#EAFBF1]',
    stripIcon: 'text-[#1A7A3C]',
    stripLabel: 'text-[#1A7A3C]',
    dot: 'bg-[#2ECC71]',
  },
};

export function TicketsQueue({
  globalSearch = '',
}: {
  globalSearch?: string;
}) {
  const { tickets, loading, updateTicketStatus, deleteTicket } = useTickets();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'ALL'>('ALL');
  const [busyTicketId, setBusyTicketId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalizedSearch = globalSearch.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchFilter = filter === 'ALL' || ticket.status === filter;
      if (!matchFilter) return false;

      if (!normalizedSearch) return true;

      const locationName = ticket.location?.name?.toLowerCase() ?? '';
      const assetName = ticket.asset?.name?.toLowerCase() ?? '';

      return (
        ticket.reporter_name.toLowerCase().includes(normalizedSearch) ||
        ticket.reporter_email.toLowerCase().includes(normalizedSearch) ||
        ticket.description.toLowerCase().includes(normalizedSearch) ||
        locationName.includes(normalizedSearch) ||
        assetName.includes(normalizedSearch)
      );
    });
  }, [tickets, filter, globalSearch]);

  const handleStatusChange = async (id: string, status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED') => {
    setBusyTicketId(id);
    const { error } = await updateTicketStatus(id, status);
    setBusyTicketId(null);
    if (error) toast.error(error.message ?? 'Errore nell\'aggiornamento');
    else toast.success('Stato aggiornato');
  };

  const handleDelete = async (id: string, code: string) => {
    const confirmed = window.confirm(`Vuoi eliminare definitivamente ${code}?`);
    if (!confirmed) return;

    setBusyTicketId(id);
    const { error } = await deleteTicket(id);
    setBusyTicketId(null);
    if (error) toast.error(error.message ?? 'Errore nell\'eliminazione');
    else toast.success('Ticket eliminato');
  };

  const handleTakeOwnership = (ticket: typeof tickets[number]) => {
    navigate('/work-orders', {
      state: {
        ticketDraft: {
          id: ticket.id,
          code: ticket.code,
          reporter_name: ticket.reporter_name,
          reporter_email: ticket.reporter_email,
          location_name: ticket.location?.name ?? null,
          problem_category: ticket.problem_category,
          description: ticket.description,
          asset_id: ticket.asset_id,
          photo_url: ticket.photo_url,
        },
      },
    });
  };

  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const closedCount = tickets.filter((t) => t.status === 'CLOSED').length;

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="overflow-hidden rounded-xl border border-[#E5E4DF] bg-white">
        {/* Breadcrumb strip */}
        <div className="border-b border-[#E5E4DF] bg-[#FAFAF9] px-6 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#888780]">
            Operatività / Tickets
          </p>
        </div>

        {/* Title + filter */}
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold tracking-[-0.02em] text-[#1C1B18]">Tickets</h1>
            <p className="mt-0.5 text-sm text-[#5F5E5A]">{filtered.length} segnalazioni visualizzate</p>
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="h-10 w-48 rounded-lg border border-[#E5E4DF] bg-white text-sm text-[#1C1B18] shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-lg border border-[#E5E4DF]">
              <SelectItem value="ALL">Tutti gli stati</SelectItem>
              <SelectItem value="OPEN">Aperti</SelectItem>
              <SelectItem value="IN_PROGRESS">In Lavorazione</SelectItem>
              <SelectItem value="CLOSED">Chiusi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mini KPI strip */}
        <div className="flex flex-wrap items-center gap-6 border-t border-[#E5E4DF] bg-[#FAFAF9] px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#E24B4A]" />
            <span className="text-xs text-[#888780]">
              <span className="font-semibold tabular-nums text-[#1C1B18]">{openCount}</span>
              {' '}Aperti
            </span>
          </div>
          <span className="h-3 w-px bg-[#E5E4DF]" />
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#888780]" />
            <span className="text-xs text-[#888780]">
              <span className="font-semibold tabular-nums text-[#1C1B18]">{inProgressCount}</span>
              {' '}In Lavorazione
            </span>
          </div>
          <span className="h-3 w-px bg-[#E5E4DF]" />
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#2ECC71]" />
            <span className="text-xs text-[#888780]">
              <span className="font-semibold tabular-nums text-[#1C1B18]">{closedCount}</span>
              {' '}Chiusi
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2ECC71] border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#E5E4DF] bg-white py-20">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#F1EFE8]">
            <Ticket size={28} className="text-[#888780]" />
          </div>
          <p className="text-base font-bold text-[#1C1B18]">Nessuna segnalazione trovata</p>
          <p className="mt-1.5 text-sm text-[#5F5E5A]">
            {filter !== 'ALL'
              ? 'Prova a cambiare il filtro stato.'
              : 'Non ci sono ticket al momento.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((ticket) => (
            <div
              key={ticket.id}
              className="group relative overflow-hidden rounded-xl border border-[#E5E4DF] bg-white transition-colors hover:border-[#D3D1C7]"
            >
              {/* Main flex: stub | body */}
              <div className="flex">

                {/* ── STUB ──────────────────────────────────────────────── */}
                <div className={cn(
                  'flex w-[160px] shrink-0 flex-col items-center justify-center gap-1.5 px-3 py-5',
                  STATUS_CONFIG[ticket.status].stripBg
                )}>
                  <AlertCircle size={20} className={STATUS_CONFIG[ticket.status].stripIcon} />
                  <span className={cn(
                    'text-[9px] font-semibold uppercase tracking-[0.10em]',
                    STATUS_CONFIG[ticket.status].stripLabel
                  )}>
                    {STATUS_CONFIG[ticket.status].label}
                  </span>
                  <span className="mt-0.5 text-[11px] font-bold tabular-nums text-[#1C1B18]">
                    {ticket.code || 'TK-...'}
                  </span>
                </div>

                {/* ── BODY ──────────────────────────────────────────────── */}
                <div className="flex min-w-0 flex-1 flex-col gap-2 px-5 py-3.5">

                  {/* Reporter + date */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-baseline gap-1.5">
                      <span className="shrink-0 text-sm font-semibold text-[#1C1B18]">{ticket.reporter_name}</span>
                      <span className="truncate text-xs text-[#888780]">{ticket.reporter_email}</span>
                    </div>
                    <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-[#888780]">
                      {format(new Date(ticket.created_at), 'd MMM yyyy · HH:mm', { locale: it })}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="line-clamp-2 text-sm leading-relaxed text-[#5F5E5A]">{ticket.description}</p>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#888780]">
                    {ticket.problem_category && (
                      <span className="flex items-center gap-1">
                        <AlertCircle size={11} />
                        {ticket.problem_category}
                      </span>
                    )}
                    {ticket.location?.name && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />
                        {ticket.location.name}
                      </span>
                    )}
                    {ticket.asset?.name && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        {ticket.asset.name}
                      </span>
                    )}
                    {ticket.photo_url && (
                      <a
                        href={ticket.photo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[#1A7A3C] hover:underline"
                      >
                        <Paperclip size={11} /> Foto allegata
                      </a>
                    )}
                    {ticket.work_order?.code && (
                      <span className="flex items-center gap-1 font-semibold text-[#1A7A3C]">
                        <CheckCircle2 size={11} /> WO: {ticket.work_order.code}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5">
                    {ticket.status !== 'IN_PROGRESS' && ticket.status !== 'CLOSED' && (
                      <Button
                        size="sm"
                        className="h-8 rounded-lg bg-[#2ECC71] px-3 text-xs font-semibold text-[#0A3D1F] hover:bg-[#27B463]"
                        disabled={busyTicketId === ticket.id}
                        onClick={() => handleTakeOwnership(ticket)}
                      >
                        Prendi in carico
                      </Button>
                    )}
                    {ticket.status !== 'CLOSED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg border-[#E5E4DF] px-3 text-xs font-semibold text-[#5F5E5A] hover:bg-[#F1EFE8]"
                        disabled={busyTicketId === ticket.id}
                        onClick={() => handleStatusChange(ticket.id, 'CLOSED')}
                      >
                        Chiudi
                      </Button>
                    )}
                    {ticket.status === 'CLOSED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg border-[#E5E4DF] px-3 text-xs font-semibold text-[#5F5E5A] hover:bg-[#F1EFE8]"
                        disabled={busyTicketId === ticket.id}
                        onClick={() => handleStatusChange(ticket.id, 'OPEN')}
                      >
                        Riapri
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg border-[#FFF0EE] px-2.5 text-xs font-semibold text-[#A83228] hover:bg-[#FFF0EE]"
                      disabled={busyTicketId === ticket.id}
                      onClick={() => handleDelete(ticket.id, ticket.code || 'questo ticket')}
                    >
                      <Trash2 size={11} className="mr-1" />
                      Elimina
                    </Button>
                  </div>

                </div>
              </div>

              {/* ── Diagonal notch cuts at stub/body boundary ────────── */}
              {/* Rotated squares half-outside card → clipped to V shapes by overflow-hidden */}
              <div
                className="pointer-events-none absolute z-10 h-5 w-5 rotate-45 bg-[#FAFAF9]"
                style={{ top: '-10px', left: '150px' }}
              />
              <div
                className="pointer-events-none absolute z-10 h-5 w-5 rotate-45 bg-[#FAFAF9]"
                style={{ bottom: '-10px', left: '150px' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
