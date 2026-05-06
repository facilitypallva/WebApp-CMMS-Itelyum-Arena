import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileOutput,
  Layers3,
  LineChart,
  MapPin,
  Package,
  RefreshCw,
  Ticket,
  Wrench,
} from 'lucide-react';
import { Badge, Button, Card, ErrorState } from '@/components/ui-v2';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, formatNumber, formatRelativeDate, workOrderPriorityConfig, workOrderStatusConfig } from '@/lib/ui-helpers';
import { PRIORITY_LABELS, WORK_ORDER_STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

const ASSET_STATUS_COLORS = ['#2ECC71', '#E8782A', '#E24B4A'];

const tooltipStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E5E4DF',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(28, 27, 24, 0.05), 0 1px 2px rgba(28, 27, 24, 0.04)',
  color: '#1C1B18',
  fontSize: '12px',
  fontWeight: 600,
  padding: '8px 12px',
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 13) return 'Buongiorno';
  if (hour < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

function formatToday() {
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-xl border border-[#E5E4DF] bg-white" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-xl border border-[#E5E4DF] bg-white" />
        ))}
      </div>
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 h-80 animate-pulse rounded-xl border border-[#E5E4DF] bg-white lg:col-span-8" />
        <div className="col-span-12 h-80 animate-pulse rounded-xl border border-[#E5E4DF] bg-white lg:col-span-4" />
      </div>
    </div>
  );
}

function InlineEmptyState({
  className,
  icon,
  title,
  description,
}: {
  className?: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className={cn('flex min-h-44 w-full flex-col items-center justify-center rounded-lg border border-dashed border-[#D3D1C7] bg-[#FAFAF9] px-6 py-8 text-center', className)}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#F1EFE8] text-[#888780]">
        {icon}
      </div>
      <p className="text-sm font-bold text-[#1C1B18]">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] font-medium text-[#5F5E5A]">{description}</p>
    </div>
  );
}

function SectionHeader({
  action,
  icon,
  subtitle,
  title,
}: {
  action?: React.ReactNode;
  icon?: React.ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-base font-bold tracking-[-0.01em] text-[#1C1B18]">{title}</h3>
        <p className="mt-0.5 text-[13px] font-medium text-[#5F5E5A]">{subtitle}</p>
      </div>
      {action ?? (icon && (
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E4DF] bg-white text-[#5F5E5A]">
          {icon}
        </div>
      ))}
    </div>
  );
}

function HorizontalBars({
  emptyDescription,
  emptyTitle,
  items,
}: {
  emptyDescription: string;
  emptyTitle: string;
  items: Array<{ name: string; value: number }>;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  if (items.length === 0) {
    return (
      <div className="flex min-h-[172px]">
        <InlineEmptyState
          className="min-h-[172px] px-5 py-6"
          icon={<Ticket size={20} />}
          title={emptyTitle}
          description={emptyDescription}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 6).map((item, index) => (
        <div key={item.name} className="rounded-lg px-2 py-1.5 transition-colors hover:bg-[#FAFAF9]">
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <span className="truncate text-[13px] font-semibold text-[#1C1B18]">{item.name}</span>
            <span className="text-sm font-bold tabular-nums text-[#1C1B18]">{formatNumber(item.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#F1EFE8]">
            <div
              className={cn('h-full rounded-full', index === 0 ? 'bg-[#1C1B18]' : 'bg-[#5F5E5A]')}
              style={{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 8 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Dashboard() {
  const { stats, loading, error, reload } = useDashboard();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const userName = profile?.full_name?.trim() || user?.email?.split('@')[0] || 'Responsabile';

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !stats) {
    return (
      <ErrorState
        className="min-h-80 border-[#E5E4DF] bg-white"
        title="Errore nel caricamento"
        description={error ?? 'Dati non disponibili'}
        onRetry={reload}
        retryLabel="Riprova"
      />
    );
  }

  const alertItems = [
    stats.expiredAssets > 0 ? `${formatNumber(stats.expiredAssets)} asset scaduti` : null,
    stats.woInProgress > 0 ? `${formatNumber(stats.woInProgress)} work order in corso` : null,
    stats.openTickets > 0 ? `${formatNumber(stats.openTickets)} ticket aperti` : null,
  ].filter(Boolean);

  const hasOperationalAlert = stats.expiredAssets > 0 || stats.openTickets > 0;
  const isCriticalAlert = stats.expiredAssets > 100 || stats.openTickets > 5;

  const kpis = [
    {
      label: 'TOT ASSET',
      value: formatNumber(stats.totalAssets),
      icon: Package,
      helper: 'Patrimonio monitorato',
      featured: false,
    },
    {
      label: 'CONFORMITÀ',
      value: `${stats.conformanceRate}%`,
      icon: CheckCircle2,
      helper: `${formatNumber(stats.okAssets + stats.expiringAssets)} asset conformi`,
      featured: false,
    },
    {
      label: 'ASSET SCADUTI',
      value: formatNumber(stats.expiredAssets),
      icon: AlertTriangle,
      helper: stats.expiredAssets > 0 ? 'Richiede intervento' : 'Nessuna criticità',
      featured: stats.expiredAssets > 0,
    },
    {
      label: 'WO IN CORSO',
      value: formatNumber(stats.woInProgress),
      icon: Clock,
      helper: 'Carico operativo',
      featured: false,
    },
    {
      label: 'TICKET APERTI',
      value: formatNumber(stats.openTickets),
      icon: Ticket,
      helper: 'Segnalazioni attive',
      featured: false,
    },
  ];

  const trendTotal = stats.monthlyTrend.reduce((sum, item) => sum + item.value, 0);
  const trendAverage = stats.monthlyTrend.length > 0 ? Math.round((trendTotal / stats.monthlyTrend.length) * 10) / 10 : 0;
  const isTrendEmpty = stats.monthlyTrend.every((item) => item.value === 0);
  const isAssetStatusEmpty = stats.assetStatusBreakdown.every((item) => item.value === 0);

  return (
    <div className="space-y-7">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold leading-[30px] tracking-[-0.02em] text-[#1C1B18]">
              {getGreeting()} {userName}
            </h2>
            {stats.expiredAssets > 0 && (
              <Badge variant="error" dot>
                {formatNumber(stats.expiredAssets)} asset scaduti
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm font-medium text-[#5F5E5A]">
            {formatToday()} · panoramica operativa di oggi
          </p>
        </div>
        <Button
          variant="primary"
          leadingIcon={<FileOutput size={16} />}
          onClick={() => navigate('/reports/cda')}
        >
          Esporta Report
        </Button>
      </section>

      {hasOperationalAlert && (
        <section
          className={cn(
            'flex flex-col gap-3 rounded-lg border px-4 py-3 shadow-[0_1px_2px_rgba(28,27,24,0.03)] sm:flex-row sm:items-center sm:justify-between',
            isCriticalAlert
              ? 'border-[#E24B4A]/20 border-l-[#E24B4A] bg-[#FFF0EE]/65 text-[#A83228] [border-left-width:3px]'
              : 'border-[#E8782A]/20 border-l-[#E8782A] bg-[#FFF3E8]/70 text-[#A8531A] [border-left-width:3px]'
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-white/70',
              isCriticalAlert ? 'border-[#E24B4A]/20' : 'border-[#E8782A]/20'
            )}>
              <AlertTriangle size={16} />
            </div>
            <div>
              <p className="text-[13px] font-bold leading-4">Richiede attenzione</p>
              <p className="mt-0.5 text-[12px] font-semibold leading-4 opacity-80">{alertItems.join(' · ')}</p>
            </div>
          </div>
          <Button
            variant="link"
            className={cn('text-[13px] font-bold', isCriticalAlert ? 'text-[#A83228]' : 'text-[#A8531A]')}
            onClick={() => navigate('/assets')}
          >
            Mostra dettagli
          </Button>
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} variant={kpi.featured ? 'featured' : 'kpi'} interactive className="min-h-32">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#888780]">{kpi.label}</p>
                <Icon
                  size={18}
                  className={kpi.featured ? 'text-[#A83228]' : 'text-[#5F5E5A]'}
                />
              </div>
              <p className="mt-3 text-[32px] font-bold leading-9 tracking-[-0.03em] text-[#1C1B18] tabular-nums">
                {kpi.value}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#5F5E5A]">{kpi.helper}</p>
            </Card>
          );
        })}
      </section>

      <section className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 lg:col-span-8">
          <SectionHeader
            title="Trend Manutenzioni"
            subtitle="WO chiusi · ultimi 12 mesi"
            action={
              <div className="rounded-lg border border-[#E5E4DF] bg-[#F1EFE8] px-2 py-1 text-xs font-bold text-[#1C1B18]">
                12M
              </div>
            }
          />
          <div className="h-64">
            {isTrendEmpty ? (
              <InlineEmptyState
                icon={<LineChart size={22} />}
                title="Nessun dato disponibile"
                description="I trend appariranno dopo il primo work order chiuso."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="arenaTrendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2ECC71" stopOpacity={0.16} />
                      <stop offset="95%" stopColor="#2ECC71" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E5E4DF" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888780', fontSize: 11, fontWeight: 500 }} dy={10} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#D3D1C7', strokeDasharray: '4 4' }} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#2ECC71"
                    strokeWidth={2}
                    fill="url(#arenaTrendGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#2ECC71', strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          {!isTrendEmpty && (
            <p className="mt-4 text-xs font-medium text-[#5F5E5A]">
              Totale 12 mesi: <span className="font-bold text-[#1C1B18]">{formatNumber(trendTotal)} WO</span> · Media mensile:{' '}
              <span className="font-bold text-[#1C1B18]">{trendAverage}</span>
            </p>
          )}
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <SectionHeader
            title="Stato Asset"
            subtitle="Distribuzione operativa"
            icon={<Layers3 size={16} />}
          />
          {isAssetStatusEmpty ? (
            <InlineEmptyState
              icon={<Layers3 size={22} />}
              title="Nessun asset disponibile"
              description="La distribuzione apparirà dopo il caricamento degli asset."
            />
          ) : (
            <div className="flex flex-col items-center gap-5 2xl:flex-row 2xl:items-center">
              <div className="relative h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.assetStatusBreakdown}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={78}
                      paddingAngle={2}
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    >
                      {stats.assetStatusBreakdown.map((entry, index) => (
                        <Cell key={entry.name} fill={ASSET_STATUS_COLORS[index % ASSET_STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}`, 'Asset']} contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold tracking-[-0.02em] text-[#1C1B18] tabular-nums">{formatNumber(stats.totalAssets)}</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.10em] text-[#888780]">Totale</span>
                </div>
              </div>
              <div className="w-full min-w-0 flex-1">
                {stats.assetStatusBreakdown.map((item, index) => {
                  const percent = stats.totalAssets > 0 ? Math.round((item.value / stats.totalAssets) * 100) : 0;
                  return (
                    <div key={item.name} className="grid grid-cols-[10px_minmax(92px,1fr)_auto_auto] items-center gap-2 border-b border-[#F1EFE8] py-2 last:border-b-0">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: ASSET_STATUS_COLORS[index % ASSET_STATUS_COLORS.length] }}
                      />
                      <span className="whitespace-nowrap text-[13px] font-semibold text-[#1C1B18]">{item.name}</span>
                      <span className="text-sm font-bold tabular-nums text-[#1C1B18]">{formatNumber(item.value)}</span>
                      <span className="w-8 text-right text-xs font-semibold text-[#888780]">{percent}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card className="flex min-h-[280px] flex-col">
          <SectionHeader
            title="Ticket per Categoria"
            subtitle="Anomalie più frequenti"
            icon={<Ticket size={16} />}
          />
          <HorizontalBars
            items={stats.ticketsByCategory}
            emptyTitle="Nessun ticket categorizzato"
            emptyDescription="I dati appariranno con i primi ticket inseriti."
          />
        </Card>

        <Card className="flex min-h-[280px] flex-col">
          <SectionHeader
            title="Ticket per Ubicazione"
            subtitle="Aree più colpite"
            icon={<MapPin size={16} />}
          />
          <HorizontalBars
            items={stats.ticketsByLocation}
            emptyTitle="Nessun ticket per ubicazione"
            emptyDescription="Le aree più colpite appariranno con i primi ticket associati a una ubicazione."
          />
        </Card>
      </section>

      <section>
        <Card className="overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-[#E5E4DF] px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-base font-bold tracking-[-0.01em] text-[#1C1B18]">Work Orders recenti</h3>
              <p className="mt-0.5 text-[13px] font-medium text-[#5F5E5A]">Ultimi interventi creati o aggiornati</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              trailingIcon={<ArrowRight size={14} />}
              onClick={() => navigate('/work-orders')}
            >
              Vedi tutti
            </Button>
          </div>

          {stats.recentWorkOrders.length === 0 ? (
            <div className="px-6 py-8">
              <InlineEmptyState
                icon={<Wrench size={22} />}
                title="Nessun work order ancora"
                description="Gli interventi recenti appariranno qui appena saranno creati."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E4DF] bg-[#FAFAF9] text-left text-[11px] font-bold uppercase tracking-[0.06em] text-[#888780]">
                    <th className="w-32 px-4 py-3">Codice</th>
                    <th className="px-4 py-3">Intervento</th>
                    <th className="w-44 px-4 py-3">Assegnato a</th>
                    <th className="w-28 px-4 py-3 text-center">Priorità</th>
                    <th className="w-36 px-4 py-3 text-center">Stato</th>
                    <th className="w-32 px-4 py-3 text-right">Creato</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentWorkOrders.map((workOrder) => {
                    const statusConfig = workOrderStatusConfig[workOrder.status];
                    const priorityConfig = workOrderPriorityConfig[workOrder.priority];
                    const assignee = workOrder.technician?.name ?? workOrder.supplier?.name ?? 'Non assegnato';

                    return (
                      <tr key={workOrder.id} className="border-b border-[#E5E4DF] bg-white transition-colors last:border-b-0 hover:bg-[#FAFAF9]">
                        <td className="px-4 py-3 align-middle">
                          <span className="text-[13px] font-bold tabular-nums text-[#1C1B18]">{workOrder.code}</span>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <p className="line-clamp-1 text-sm font-semibold text-[#1C1B18]">{workOrder.description}</p>
                          <p className="mt-0.5 line-clamp-1 text-xs font-medium text-[#5F5E5A]">
                            {workOrder.asset?.name ?? 'Asset non disponibile'}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <p className="line-clamp-1 text-[13px] font-semibold text-[#1C1B18]">{assignee}</p>
                        </td>
                        <td className="px-4 py-3 text-center align-middle">
                          <Badge variant={priorityConfig.variant} dot={priorityConfig.dot} size="sm">
                            {PRIORITY_LABELS[workOrder.priority]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center align-middle">
                          <Badge
                            variant={statusConfig.variant}
                            dot={statusConfig.dot}
                            size="sm"
                            className={statusConfig.className}
                          >
                            {WORK_ORDER_STATUS_LABELS[workOrder.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right align-middle">
                          <p className="text-[13px] font-semibold text-[#5F5E5A]">{formatRelativeDate(workOrder.created_at)}</p>
                          <p className="text-[11px] font-medium text-[#888780]">{formatDate(workOrder.created_at)}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
