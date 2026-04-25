import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { calculateAssetStatus } from '@/lib/assetUtils';
import { WorkOrder } from '@/types';
import { onCacheInvalidated } from '@/lib/cacheEvents';
import { withRequestTimeout } from '@/lib/resilientRequest';

type ChartDatum = {
  name: string;
  value: number;
};

type TicketBreakdownRow = {
  problem_category: string | null;
  location: { name: string } | { name: string }[] | null;
};

interface DashboardStats {
  totalAssets: number;
  expiredAssets: number;
  expiringAssets: number;
  okAssets: number;
  conformanceRate: number;
  woInProgress: number;
  openTickets: number;
  recentWorkOrders: WorkOrder[];
  monthlyTrend: ChartDatum[];
  assetStatusBreakdown: ChartDatum[];
  ticketsByCategory: ChartDatum[];
  ticketsByLocation: ChartDatum[];
}

const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
const DASHBOARD_CACHE_TTL_MS = 60_000;

let dashboardCache: DashboardStats | null = null;
let dashboardCacheAt = 0;

export function invalidateDashboardCache() {
  dashboardCache = null;
  dashboardCacheAt = 0;
}

onCacheInvalidated('work_orders', invalidateDashboardCache);
onCacheInvalidated('assets', invalidateDashboardCache);
onCacheInvalidated('tickets', invalidateDashboardCache);

async function loadDashboardFromApi() {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const [assetsRes, woRes, ticketsRes, trendRes, inProgressRes, ticketsBreakdownRes] = await withRequestTimeout(
    (signal) => Promise.all([
      supabase.from('assets').select('last_verification, verification_frequency_days').abortSignal(signal),
      supabase.from('work_orders').select('*, asset:assets(name, category), technician:technicians(name)').in('status', ['IN_PROGRESS', 'NEW', 'ASSIGNED', 'PLANNED']).order('created_at', { ascending: false }).limit(5).abortSignal(signal),
      supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'OPEN').abortSignal(signal),
      supabase.from('work_orders').select('closed_at').eq('status', 'CLOSED').not('closed_at', 'is', null).gte('closed_at', twelveMonthsAgo.toISOString()).abortSignal(signal),
      supabase.from('work_orders').select('id', { count: 'exact', head: true }).eq('status', 'IN_PROGRESS').abortSignal(signal),
      supabase.from('tickets').select('problem_category, location:locations(name)').abortSignal(signal),
    ]),
    15_000,
    'Timeout durante il caricamento della dashboard'
  );

  const assetData = assetsRes.data ?? [];
  let expired = 0, expiring = 0, ok = 0;
  for (const a of assetData) {
    const s = calculateAssetStatus(a.last_verification, a.verification_frequency_days);
    if (s === 'SCADUTO') expired++;
    else if (s === 'IN SCADENZA') expiring++;
    else ok++;
  }
  const total = assetData.length;
  const conformance = total > 0 ? Math.round(((ok + expiring) / total) * 100 * 10) / 10 : 100;
  const assetStatusBreakdown = [
    { name: 'In Regola', value: ok },
    { name: 'In Scadenza', value: expiring },
    { name: 'Scaduto', value: expired },
  ];

  const now = new Date();
  const trend = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return { name: MONTHS[d.getMonth()], month: d.getMonth(), year: d.getFullYear(), value: 0 };
  });
  const trendMap = new Map(trend.map((t) => [`${t.year}-${t.month}`, t]));
  for (const wo of trendRes.data ?? []) {
    const d = new Date(wo.closed_at);
    const slot = trendMap.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (slot) slot.value++;
  }

  const ticketsByCategoryMap = new Map<string, number>();
  const ticketsByLocationMap = new Map<string, number>();

  for (const ticket of (ticketsBreakdownRes.data ?? []) as TicketBreakdownRow[]) {
    const categoryName = ticket.problem_category?.trim() || 'Non categorizzato';
    const location = Array.isArray(ticket.location) ? ticket.location[0] : ticket.location;
    const locationName = location?.name?.trim() || 'Ubicazione non definita';

    ticketsByCategoryMap.set(categoryName, (ticketsByCategoryMap.get(categoryName) ?? 0) + 1);
    ticketsByLocationMap.set(locationName, (ticketsByLocationMap.get(locationName) ?? 0) + 1);
  }

  const sortChartData = (map: Map<string, number>, limit = 6) =>
    Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);

  const ticketsByCategory = sortChartData(ticketsByCategoryMap);
  const ticketsByLocation = sortChartData(ticketsByLocationMap, 5);

  const nextStats = {
    totalAssets: total,
    expiredAssets: expired,
    expiringAssets: expiring,
    okAssets: ok,
    conformanceRate: conformance,
    woInProgress: inProgressRes.count ?? 0,
    openTickets: ticketsRes.count ?? 0,
    recentWorkOrders: woRes.data ?? [],
    monthlyTrend: trend.map(({ name, value }) => ({ name, value })),
    assetStatusBreakdown,
    ticketsByCategory,
    ticketsByLocation,
  };

  dashboardCache = nextStats;
  dashboardCacheAt = Date.now();
  return nextStats;
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(dashboardCache);
  const [loading, setLoading] = useState(!dashboardCache);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const hasFreshCache = dashboardCache && Date.now() - dashboardCacheAt < DASHBOARD_CACHE_TTL_MS;

    if (dashboardCache) {
      setStats(dashboardCache);
      setLoading(false);
      if (hasFreshCache) return;
      // stale cache: background refresh, keep showing current data
    } else {
      setLoading(true);
      setError(null);
    }

    const isBackgroundRefresh = dashboardCache !== null;

    loadDashboardFromApi()
      .then((nextStats) => {
        setStats(nextStats);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Dashboard load error', err);
        setLoading(false);
        if (!isBackgroundRefresh) {
          setError('Impossibile caricare i dati della dashboard. Controlla la connessione e riprova.');
        }
      });
  }, [tick]);

  const reload = useCallback(() => {
    invalidateDashboardCache();
    setTick((t) => t + 1);
  }, []);

  return { stats, loading, error, reload };
}
