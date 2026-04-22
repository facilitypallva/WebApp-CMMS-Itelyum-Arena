import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Ticket } from '@/types';
import { runResilientRequest } from '@/lib/resilientRequest';

const TICKETS_CACHE_TTL_MS = 30_000;

let ticketsCache: Ticket[] | null = null;
let ticketsCacheAt = 0;

function sortTickets(items: Ticket[]) {
  return [...items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function commitTicketsCache(nextTickets: Ticket[]) {
  const committed = sortTickets(nextTickets);
  ticketsCache = committed;
  ticketsCacheAt = Date.now();
  return committed;
}

async function loadTicketsFromApi() {
  const { data, error } = await runResilientRequest(
    (signal) => supabase
      .from('tickets')
      .select('*, location:locations(name), asset:assets(name), work_order:work_orders(id, code)')
      .order('created_at', { ascending: false })
      .abortSignal(signal),
    {
      label: 'tickets fetch',
      timeoutMessage: 'Timeout durante il caricamento dei ticket',
    }
  );

  if (error) {
    throw error;
  }

  return commitTicketsCache((data ?? []) as Ticket[]);
}

export function useTickets(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(enabled && !ticketsCache);

  const fetchTickets = useCallback(async (force = false) => {
    if (!enabled) {
      setLoading(false);
      return [];
    }

    const hasFreshCache = ticketsCache && Date.now() - ticketsCacheAt < TICKETS_CACHE_TTL_MS;

    if (!force && ticketsCache) {
      setTickets(ticketsCache);
      setLoading(false);
      if (hasFreshCache) return ticketsCache;
    } else {
      setLoading(true);
    }

    const freshTickets = await loadTicketsFromApi();
    setTickets(freshTickets);
    setLoading(false);
    return freshTickets;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setTickets([]);
      setLoading(false);
      return;
    }

    fetchTickets().catch(console.error);
  }, [enabled, fetchTickets]);

  const updateTicketStatus = async (id: string, status: Ticket['status'], workOrderId?: string) => {
    const payload: Partial<Ticket> = { status };
    if (workOrderId) payload.work_order_id = workOrderId;
    const { error } = await runResilientRequest(
      (signal) => supabase
        .from('tickets')
        .update(payload)
        .eq('id', id)
        .abortSignal(signal),
      {
        label: 'ticket update',
        timeoutMessage: 'Timeout durante l\'aggiornamento del ticket',
      }
    );
    if (!error) {
      const nextTickets = commitTicketsCache(
        (ticketsCache ?? []).map((ticket) => (ticket.id === id ? { ...ticket, ...payload } : ticket))
      );
      setTickets(nextTickets);
    }
    return { error };
  };

  const deleteTicket = async (id: string) => {
    const previousTickets = ticketsCache ?? tickets;
    const nextTickets = commitTicketsCache(previousTickets.filter((ticket) => ticket.id !== id));
    setTickets(nextTickets);
    const { error } = await runResilientRequest(
      (signal) => supabase.from('tickets').delete().eq('id', id).abortSignal(signal),
      {
        label: 'ticket delete',
        timeoutMessage: 'Timeout durante l\'eliminazione del ticket',
      }
    );
    if (error) {
      const restoredTickets = commitTicketsCache(previousTickets);
      setTickets(restoredTickets);
      return { error };
    }
    return { error };
  };

  return { tickets, loading, fetchTickets, updateTicketStatus, deleteTicket };
}
