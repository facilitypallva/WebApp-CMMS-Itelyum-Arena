import React, { useMemo, useState } from 'react';
import { Ticket, CheckCircle2, AlertCircle, MapPin, Paperclip, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTickets } from '@/hooks/useTickets';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  OPEN: { label: 'Aperto', cls: 'bg-red-100 text-red-700' },
  IN_PROGRESS: { label: 'In Lavorazione', cls: 'bg-blue-100 text-blue-700' },
  CLOSED: { label: 'Chiuso', cls: 'bg-emerald-100 text-emerald-700' },
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

      const locationName = (ticket as any).location?.name?.toLowerCase() ?? '';
      const assetName = (ticket as any).asset?.name?.toLowerCase() ?? '';

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Coda Segnalazioni</h2>
          <p className="text-sm text-slate-500">{tickets.filter((t) => t.status === 'OPEN').length} ticket aperti</p>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="h-11 rounded-xl border-none shadow-sm bg-white w-44"><SelectValue /></SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="ALL">Tutti</SelectItem>
            <SelectItem value="OPEN">Aperti</SelectItem>
            <SelectItem value="IN_PROGRESS">In Lavorazione</SelectItem>
            <SelectItem value="CLOSED">Chiusi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl text-slate-400">
          <Ticket size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium">Nessuna segnalazione trovata</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((ticket) => (
            <Card key={ticket.id} className="border-none shadow-sm rounded-3xl bg-white hover:shadow-md transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0',
                    ticket.status === 'OPEN' ? 'bg-red-100 text-red-600' :
                    ticket.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600')}>
                    <AlertCircle size={22} />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-xs font-bold tracking-wider text-primary">
                            {ticket.code || 'TK-...'}
                          </p>
                          <p className="font-bold text-slate-800">{ticket.reporter_name}</p>
                          <Badge className={cn(STATUS_CONFIG[ticket.status].cls, 'border-none text-[10px] font-bold rounded-lg px-2')}>
                            {STATUS_CONFIG[ticket.status].label}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400">{ticket.reporter_email}</p>
                      </div>
                      <span className="text-xs text-slate-400">{format(new Date(ticket.created_at), 'd MMM yyyy HH:mm', { locale: it })}</span>
                    </div>
                    <p className="text-sm text-slate-600">{ticket.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      {ticket.problem_category && (
                        <span className="flex items-center gap-1"><AlertCircle size={12} /> {ticket.problem_category}</span>
                      )}
                      {(ticket as any).location?.name && (
                        <span className="flex items-center gap-1"><MapPin size={12} /> {(ticket as any).location.name}</span>
                      )}
                      {(ticket as any).asset?.name && (
                        <span className="flex items-center gap-1"><CheckCircle2 size={12} /> {(ticket as any).asset.name}</span>
                      )}
                      {ticket.photo_url && (
                        <a
                          href={ticket.photo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Paperclip size={12} /> Foto allegata
                        </a>
                      )}
                      {ticket.work_order?.code && (
                        <span className="flex items-center gap-1 font-semibold text-emerald-700">
                          <CheckCircle2 size={12} /> WO collegato: {ticket.work_order.code}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 pt-1">
                      {ticket.status !== 'IN_PROGRESS' && ticket.status !== 'CLOSED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg h-8 text-xs font-bold"
                          disabled={busyTicketId === ticket.id}
                          onClick={() => handleTakeOwnership(ticket)}
                        >
                          Prendi in carico
                        </Button>
                      )}
                      {ticket.status !== 'CLOSED' && (
                        <Button
                          size="sm"
                          className="rounded-lg h-8 text-xs font-bold bg-emerald-500 hover:bg-emerald-600"
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
                          className="rounded-lg h-8 text-xs font-bold"
                          disabled={busyTicketId === ticket.id}
                          onClick={() => handleStatusChange(ticket.id, 'OPEN')}
                        >
                          Riapri
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg h-8 text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        disabled={busyTicketId === ticket.id}
                        onClick={() => handleDelete(ticket.id, ticket.code || 'questo ticket')}
                      >
                        <Trash2 size={12} className="mr-1.5" />
                        Elimina
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
