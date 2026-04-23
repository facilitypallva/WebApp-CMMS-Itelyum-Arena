import React, { useDeferredValue, useMemo, useRef, useState } from 'react';
import { AlertCircle, Bell, BriefcaseBusiness, ClipboardList, MapPin, Menu, Search, ShieldCheck, UserRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAssets } from '@/hooks/useAssets';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import { useTickets } from '@/hooks/useTickets';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useTechnicians } from '@/hooks/useTechnicians';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

interface HeaderProps {
  title: string;
  globalSearch?: string;
  onGlobalSearchChange?: (value: string) => void;
  onGlobalSearchApply?: (path: string, value: string) => void;
}

type SearchResult = {
  id: string;
  kind: 'asset' | 'workOrder' | 'ticket' | 'supplier' | 'technician';
  title: string;
  subtitle: string;
  route: string;
  routeSearch: string;
};

const RESULT_META = {
  asset: {
    label: 'Asset',
    Icon: ShieldCheck,
  },
  workOrder: {
    label: 'Work Order',
    Icon: ClipboardList,
  },
  ticket: {
    label: 'Ticket',
    Icon: AlertCircle,
  },
  supplier: {
    label: 'Fornitore',
    Icon: BriefcaseBusiness,
  },
  technician: {
    label: 'Tecnico',
    Icon: UserRound,
  },
} as const;

function buildSearchText(parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(' ').toLowerCase();
}

export function Header({
  title,
  globalSearch = '',
  onGlobalSearchChange,
  onGlobalSearchApply,
}: HeaderProps) {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const searchEnabled = isSearchOpen || globalSearch.trim().length > 0;
  const { assets } = useAssets({ enabled: searchEnabled });
  const { workOrders } = useWorkOrders({ enabled: searchEnabled });
  const { tickets } = useTickets({ enabled: searchEnabled });
  const { suppliers } = useSuppliers({ enabled: searchEnabled });
  const { technicians } = useTechnicians({ enabled: searchEnabled });
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const deferredSearch = useDeferredValue(globalSearch.trim().toLowerCase());
  const closeTimeoutRef = useRef<number | null>(null);

  const results = useMemo(() => {
    if (!deferredSearch) return [];

    const assetResults: SearchResult[] = assets
      .filter((asset) => buildSearchText([
        asset.name,
        asset.serial_number,
        asset.brand,
        asset.model,
        asset.category,
        (asset as { location?: { name?: string | null } }).location?.name,
      ]).includes(deferredSearch))
      .slice(0, 5)
      .map((asset) => ({
        id: asset.id,
        kind: 'asset',
        title: asset.name,
        subtitle: [asset.serial_number, asset.category].filter(Boolean).join(' • ') || 'Asset',
        route: '/assets',
        routeSearch: asset.serial_number || asset.name,
      }));

    const workOrderResults: SearchResult[] = workOrders
      .filter((workOrder) => buildSearchText([
        workOrder.description,
        workOrder.status,
        workOrder.type,
        workOrder.asset?.name,
        workOrder.technician?.name,
        workOrder.supplier?.name,
      ]).includes(deferredSearch))
      .slice(0, 5)
      .map((workOrder) => ({
        id: workOrder.id,
        kind: 'workOrder',
        title: workOrder.asset?.name || 'Work Order',
        subtitle: [workOrder.description, workOrder.status].filter(Boolean).join(' • '),
        route: '/work-orders',
        routeSearch: workOrder.asset?.name || workOrder.description,
      }));

    const ticketResults: SearchResult[] = tickets
      .filter((ticket) => buildSearchText([
        ticket.reporter_name,
        ticket.reporter_email,
        ticket.description,
        (ticket as { location?: { name?: string | null } }).location?.name,
        (ticket as { asset?: { name?: string | null } }).asset?.name,
        ticket.status,
      ]).includes(deferredSearch))
      .slice(0, 5)
      .map((ticket) => ({
        id: ticket.id,
        kind: 'ticket',
        title: ticket.reporter_name,
        subtitle: [ticket.description, ticket.status].filter(Boolean).join(' • '),
        route: '/tickets',
        routeSearch: ticket.reporter_name,
      }));

    const supplierResults: SearchResult[] = suppliers
      .filter((supplier) => buildSearchText([
        supplier.name,
        supplier.category,
        supplier.contact_info?.phone,
        supplier.contact_info?.email,
      ]).includes(deferredSearch))
      .slice(0, 5)
      .map((supplier) => ({
        id: supplier.id,
        kind: 'supplier',
        title: supplier.name,
        subtitle: [supplier.category, supplier.contact_info?.email].filter(Boolean).join(' • ') || 'Fornitore',
        route: '/suppliers',
        routeSearch: supplier.name,
      }));

    const technicianResults: SearchResult[] = technicians
      .filter((technician) => buildSearchText([
        technician.name,
        technician.email,
        technician.specialization,
        technician.supplier?.name,
        technician.employment_type,
      ]).includes(deferredSearch))
      .slice(0, 5)
      .map((technician) => ({
        id: technician.id,
        kind: 'technician',
        title: technician.name,
        subtitle: [technician.specialization, technician.supplier?.name, technician.email].filter(Boolean).join(' • ') || 'Tecnico',
        route: '/suppliers',
        routeSearch: technician.name,
      }));

    return [
      ...assetResults,
      ...workOrderResults,
      ...ticketResults,
      ...supplierResults,
      ...technicianResults,
    ];
  }, [assets, deferredSearch, suppliers, technicians, tickets, workOrders]);

  const groupedResults = useMemo(() => {
    return results.reduce<Record<SearchResult['kind'], SearchResult[]>>((groups, result) => {
      if (!groups[result.kind]) {
        groups[result.kind] = [];
      }
      groups[result.kind].push(result);
      return groups;
    }, {
      asset: [],
      workOrder: [],
      ticket: [],
      supplier: [],
      technician: [],
    });
  }, [results]);

  const hasSearchResults = results.length > 0;
  const shouldShowSearchPanel = isSearchOpen && globalSearch.trim().length > 0;

  const openSearchPanel = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsSearchOpen(true);
  };

  const closeSearchPanel = () => {
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsSearchOpen(false);
    }, 120);
  };

  const handleSelectResult = (result: SearchResult) => {
    onGlobalSearchApply?.(result.route, result.routeSearch);
    setIsSearchOpen(false);
  };

  const handleNotificationClick = async (notificationId: string, entityType: string, entityId: string | null) => {
    await markAsRead(notificationId);
    setIsNotificationsOpen(false);

    if (entityType === 'ticket') {
      navigate('/tickets');
      return;
    }

    if (entityType === 'work_order') {
      navigate('/work-orders');
    }
  };

  return (
    <header className="h-20 border-b bg-white/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu size={24} />
        </Button>
        <div className="hidden md:flex flex-col">
          <h1 className="text-xl font-bold text-slate-800">{title}</h1>
          <p className="text-xs text-slate-500 font-medium">Itelyum Arena – Varese</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div
          className="hidden lg:flex items-center relative w-80"
          onFocus={openSearchPanel}
          onBlur={closeSearchPanel}
        >
          <Search className="absolute left-3 text-slate-400" size={18} />
          <Input 
            placeholder="Cerca asset, ticket o WO..." 
            className="pl-10 h-11 bg-slate-100/50 border-none rounded-xl focus-visible:ring-primary/20"
            value={globalSearch}
            onChange={(event) => onGlobalSearchChange?.(event.target.value)}
          />
          {shouldShowSearchPanel && (
            <div className="absolute top-[calc(100%+0.75rem)] left-0 z-30 flex max-h-[30rem] w-[30rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Ricerca Globale</p>
                <Badge variant="outline" className="rounded-full border-slate-200 text-[10px] font-bold text-slate-500">
                  {results.length} risultati
                </Badge>
              </div>

              {!hasSearchResults ? (
                <div className="px-3 py-6 text-center text-sm text-slate-400">
                  Nessun risultato per "{globalSearch}"
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-hidden">
                <ScrollArea className="h-[24rem]">
                  <div className="space-y-3 p-1">
                    {(Object.keys(groupedResults) as Array<keyof typeof groupedResults>).map((groupKey) => {
                      const items = groupedResults[groupKey];
                      if (items.length === 0) return null;

                      const { label, Icon } = RESULT_META[groupKey];

                      return (
                        <div key={groupKey} className="space-y-1">
                          <div className="flex items-center gap-2 px-2 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                            <Icon size={12} />
                            <span>{label}</span>
                          </div>
                          {items.map((item) => {
                            const ItemIcon = RESULT_META[item.kind].Icon;

                            return (
                              <button
                                key={`${item.kind}-${item.id}`}
                                type="button"
                                className="flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-50"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => handleSelectResult(item)}
                              >
                                <div className="mt-0.5 rounded-lg bg-slate-100 p-2 text-slate-500">
                                  <ItemIcon size={14} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-slate-800">{item.title}</p>
                                  <p className="line-clamp-2 text-xs text-slate-500">{item.subtitle}</p>
                                </div>
                                <div className="pt-1 text-slate-300">
                                  <MapPin size={14} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-11 w-11 rounded-xl text-slate-500 hover:bg-primary/5 hover:text-primary"
              onClick={() => setIsNotificationsOpen((current) => !current)}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            {isNotificationsOpen && (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] z-20 flex max-h-[30rem] w-[24rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                <div className="flex items-center justify-between px-3 py-2">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Notifiche</p>
                  <Badge variant="outline" className="rounded-full border-slate-200 text-[10px] font-bold text-slate-500">
                    {unreadCount} non lette
                  </Badge>
                </div>

                {notifications.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-slate-400">
                    Nessuna notifica disponibile
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 overflow-hidden">
                  <ScrollArea className="h-[24rem]">
                    <div className="space-y-1 p-1">
                      {notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          className="flex w-full flex-col items-start gap-1 rounded-xl px-3 py-3 text-left transition-colors hover:bg-slate-50"
                          onClick={() => handleNotificationClick(notification.id, notification.entity_type, notification.entity_id)}
                        >
                          <div className="flex w-full items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-800">{notification.title}</p>
                            {!notification.read_at && (
                              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{notification.message}</p>
                          <p className="text-[11px] font-medium text-slate-400">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: it })}
                          </p>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                  </div>
                )}
              </div>
            )}
          </div>
          <Button variant="outline" className="hidden sm:flex border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl h-11 px-6">
            Help Center
          </Button>
        </div>
      </div>
    </header>
  );
}
