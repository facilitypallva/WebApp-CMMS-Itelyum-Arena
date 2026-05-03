import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import {
  Package, CheckCircle2, AlertTriangle, Clock,
  Ticket, MapPin, Layers3, FileOutput, RefreshCw,
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/contexts/AuthContext';

const ASSET_STATUS_COLORS = ['#27e58c', '#c98a24', '#d84a4a'];

const TOOLTIP_STYLE = {
  backgroundColor: '#15171c',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: 'none',
  color: '#f7f8fa',
  padding: '10px 14px',
  fontSize: '12px',
};

function ChartEmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-[var(--arena-radius-md)] border border-dashed border-[var(--arena-border-soft)] bg-[var(--arena-surface-subtle)]/60 text-xs text-[var(--arena-text-muted)]">
      Nessun dato — {label.toLowerCase()}
    </div>
  );
}

export function Dashboard() {
  const { stats, loading, error, reload } = useDashboard();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const userName = profile?.full_name?.trim() || user?.email?.split('@')[0] || 'Responsabile';

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--arena-border)] border-t-[var(--arena-accent)]" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-[var(--arena-radius-lg)] border border-dashed border-[var(--arena-border-soft)] bg-[var(--arena-surface)] text-center">
        <AlertTriangle size={36} className="text-[var(--arena-text-muted)]" />
        <div className="space-y-1">
          <p className="font-semibold text-[var(--arena-text-primary)]">Errore nel caricamento</p>
          <p className="text-sm text-[var(--arena-text-secondary)]">{error ?? 'Dati non disponibili'}</p>
        </div>
        <Button variant="outline" className="gap-2 rounded-[var(--arena-radius-md)] border-[var(--arena-border-soft)] bg-[var(--arena-surface-elevated)] text-[var(--arena-text-primary)] hover:bg-[var(--arena-surface-subtle)]" onClick={reload}>
          <RefreshCw size={14} /> Riprova
        </Button>
      </div>
    );
  }

  const kpis = [
    { label: 'Tot Asset', value: stats.totalAssets.toString(), icon: Package, color: 'bg-[var(--arena-info-soft)] text-[var(--arena-info)]' },
    { label: 'Conformità', value: `${stats.conformanceRate}%`, icon: CheckCircle2, color: 'bg-[var(--arena-accent-soft)] text-[var(--arena-accent)]' },
    { label: 'Asset Scaduti', value: stats.expiredAssets.toString(), icon: AlertTriangle, color: 'bg-[var(--arena-danger-soft)] text-[var(--arena-danger)]' },
    { label: 'WO In Corso', value: stats.woInProgress.toString(), icon: Clock, color: 'bg-[var(--arena-warning-soft)] text-[var(--arena-warning)]' },
    { label: 'Ticket Aperti', value: stats.openTickets.toString(), icon: Ticket, color: 'bg-[rgba(139,148,255,0.12)] text-[#8b94ff]' },
  ];

  return (
    <div className="mx-auto flex min-h-full max-w-400 flex-col justify-between gap-5">

      {/* Header — compact single row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between rounded-[var(--arena-radius-lg)] border border-[var(--arena-border-soft)] bg-[var(--arena-surface)] px-5 py-2.5"
      >
        <div className="flex items-baseline gap-3">
          <h2 className="arena-heading text-lg font-semibold text-[var(--arena-text-primary)]">
            Buongiorno {userName}
          </h2>
          {stats.expiredAssets > 0 && (
            <span className="rounded-full bg-[var(--arena-danger-soft)] px-2 py-0.5 text-xs font-medium text-[var(--arena-danger)]">{stats.expiredAssets} asset scaduti</span>
          )}
        </div>
        <Button
          className="h-8 gap-1.5 rounded-[var(--arena-radius-sm)] bg-[var(--arena-accent)]/90 px-3 text-sm font-medium text-[#07110c] hover:bg-[var(--arena-accent)]"
          onClick={() => navigate('/reports/cda')}
        >
          <FileOutput size={14} /> Report
        </Button>
      </motion.div>

      {/* KPIs — 5 columns */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Card className="overflow-hidden rounded-[var(--arena-radius-lg)] border border-[var(--arena-border-soft)] bg-[var(--arena-surface)] py-0 shadow-none transition-colors duration-150 hover:bg-[var(--arena-surface-elevated)]">
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--arena-text-muted)]">{kpi.label}</p>
                  <p className="arena-heading text-[26px] font-semibold leading-tight text-[var(--arena-text-primary)]">{kpi.value}</p>
                </div>
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--arena-radius-sm)]', kpi.color)}>
                  <kpi.icon size={16} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts row 1: Area trend · Donut asset */}
      <div className="grid grid-cols-12 gap-3">

        {/* Area Chart — Trend Manutenzioni */}
        <Card className="col-span-12 overflow-hidden rounded-[var(--arena-radius-lg)] border border-[var(--arena-border-soft)] bg-[var(--arena-surface)] p-4 shadow-none lg:col-span-7">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <CardTitle className="arena-heading text-sm font-semibold text-[var(--arena-text-primary)]">Trend Manutenzioni</CardTitle>
              <p className="text-[11px] text-[var(--arena-text-muted)]">WO chiusi · ultimi 12 mesi</p>
            </div>
          </div>
          <div className="h-36">
            {stats.monthlyTrend.every((m) => m.value === 0) ? (
              <ChartEmptyState label="Trend Manutenzioni" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyTrend} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6b7cff" stopOpacity={0.16} />
                      <stop offset="95%" stopColor="#6b7cff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#656d7c', fontSize: 10 }} dy={6} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#656d7c', fontSize: 10 }} allowDecimals={false} width={24} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#6b7cff"
                    strokeWidth={2}
                    fill="url(#trendGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#6b7cff', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Donut — Stato Asset */}
        <Card className="col-span-12 overflow-hidden rounded-[var(--arena-radius-lg)] border border-[var(--arena-border-soft)] bg-[var(--arena-surface)] p-4 shadow-none lg:col-span-5">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <CardTitle className="arena-heading text-sm font-semibold text-[var(--arena-text-primary)]">Stato Asset</CardTitle>
              <p className="text-[11px] text-[var(--arena-text-muted)]">Distribuzione operativa</p>
            </div>
            <Layers3 size={15} className="shrink-0 text-[var(--arena-text-muted)]" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-36 w-36 shrink-0">
              {stats.assetStatusBreakdown.every((i) => i.value === 0) ? (
                <ChartEmptyState label="Stato Asset" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.assetStatusBreakdown}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={46}
                      outerRadius={68}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {stats.assetStatusBreakdown.map((entry, index) => (
                        <Cell key={entry.name} fill={ASSET_STATUS_COLORS[index % ASSET_STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value}`, 'Asset']}
                      contentStyle={TOOLTIP_STYLE}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {stats.assetStatusBreakdown.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between rounded-[var(--arena-radius-md)] bg-[var(--arena-surface-subtle)] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: ASSET_STATUS_COLORS[index % ASSET_STATUS_COLORS.length] }}
                    />
                    <span className="text-xs font-medium text-[var(--arena-text-secondary)]">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-[var(--arena-text-primary)]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

      </div>

      {/* Charts row 2: Ticket per Categoria · Ticket per Ubicazione */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">

        <Card className="overflow-hidden rounded-[var(--arena-radius-lg)] border border-[var(--arena-border-soft)] bg-[var(--arena-surface)] p-4 shadow-none">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <CardTitle className="arena-heading text-sm font-semibold text-[var(--arena-text-primary)]">Ticket per Categoria</CardTitle>
              <p className="text-[11px] text-[var(--arena-text-muted)]">Anomalie più frequenti</p>
            </div>
            <Ticket size={15} className="shrink-0 text-[var(--arena-text-muted)]" />
          </div>
          <div className="h-32">
            {stats.ticketsByCategory.length === 0 ? (
              <ChartEmptyState label="Ticket per Categoria" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.ticketsByCategory.slice(0, 5)}
                  layout="vertical"
                  margin={{ left: 8, right: 8, top: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="catGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6b7cff" />
                      <stop offset="100%" stopColor="#27e58c" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: '#656d7c', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={120} tick={{ fill: '#9aa3b2', fontSize: 10 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="value" fill="url(#catGradient)" radius={[0, 6, 6, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden rounded-[var(--arena-radius-lg)] border border-[var(--arena-border-soft)] bg-[var(--arena-surface)] p-4 shadow-none">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <CardTitle className="arena-heading text-sm font-semibold text-[var(--arena-text-primary)]">Ticket per Ubicazione</CardTitle>
              <p className="text-[11px] text-[var(--arena-text-muted)]">Aree più colpite</p>
            </div>
            <MapPin size={15} className="shrink-0 text-[var(--arena-text-muted)]" />
          </div>
          <div className="h-32">
            {stats.ticketsByLocation.length === 0 ? (
              <ChartEmptyState label="Ticket per Ubicazione" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.ticketsByLocation.slice(0, 5)}
                  layout="vertical"
                  margin={{ left: 8, right: 8, top: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="locGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#27e58c" />
                      <stop offset="100%" stopColor="#6b7cff" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: '#656d7c', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={130} tick={{ fill: '#9aa3b2', fontSize: 10 }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="value" fill="url(#locGradient)" radius={[0, 6, 6, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}
