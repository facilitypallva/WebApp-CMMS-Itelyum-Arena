import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Package, CheckCircle2, AlertTriangle, Clock, ArrowRight, ChevronRight, ClipboardList, Ticket, MapPin, Layers3, FileOutput } from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { WORK_ORDER_STATUS_LABELS } from '@/lib/constants';
import vareseLogo from '@/assets/pallacanestro-varese-logo.png';
import ikeIroegbuPhoto from '@/assets/ike-iroegbu.jpg';

const ASSET_STATUS_COLORS = ['#10b981', '#f59e0b', '#ef4444'];
const CATEGORY_BAR_COLOR = '#2563eb';
const LOCATION_BAR_COLOR = '#0f766e';

function ChartEmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 text-sm text-slate-400">
      Nessun dato disponibile per {label.toLowerCase()}
    </div>
  );
}

export function Dashboard() {
  const { stats, loading } = useDashboard();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const userName = profile?.full_name?.trim() || user?.email?.split('@')[0] || 'Responsabile';

  if (loading || !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const kpis = [
    { label: 'Tot Asset', value: stats.totalAssets.toString(), icon: Package, color: 'bg-blue-500' },
    { label: 'Conformità', value: `${stats.conformanceRate}%`, icon: CheckCircle2, color: 'bg-emerald-500' },
    { label: 'Asset Scaduti', value: stats.expiredAssets.toString(), icon: AlertTriangle, color: 'bg-red-500' },
    { label: 'WO In Corso', value: stats.woInProgress.toString(), icon: Clock, color: 'bg-orange-500' },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-[2rem] p-8 text-white shadow-2xl shadow-primary/20 md:flex-row"
      >
        <img
          src={ikeIroegbuPhoto}
          alt="Pallacanestro Varese in azione"
          className="absolute inset-0 h-full w-full object-cover object-center [object-position:center_58%]"
        />
        <div className="absolute inset-0 bg-slate-950/58" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/82 via-slate-950/62 to-slate-950/72" />
        <div className="relative z-10 space-y-2">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center p-1">
              <img src={vareseLogo} alt="Pallacanestro Varese" className="h-full w-full object-contain" />
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/70">Pallacanestro Varese</p>
          </div>
          <h2 className="text-3xl font-bold">Benvenuto, {userName}</h2>
          <p className="max-w-lg text-blue-100 opacity-90">
            {stats.expiredAssets > 0 ? (
              <>
                <span className="font-bold underline">{stats.expiredAssets} asset scaduti</span> richiedono attenzione immediata.
              </>
            ) : (
              'Tutti gli asset sono in regola. Ottimo lavoro!'
            )}
            {stats.openTickets > 0 && (
              <>
                {' '}
                Hai <span className="font-bold underline">{stats.openTickets} ticket aperti</span>.
              </>
            )}
          </p>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" className="h-11 rounded-xl px-6 font-semibold text-primary" onClick={() => navigate('/work-orders')}>
              Vedi Interventi
            </Button>
            <Button variant="ghost" className="h-11 rounded-xl px-6 font-semibold text-white hover:bg-white/10" onClick={() => navigate('/tickets')}>
              Gestisci Ticket
            </Button>
            <Button variant="ghost" className="h-11 rounded-xl px-6 font-semibold text-white hover:bg-white/10" onClick={() => navigate('/reports/cda')}>
              <FileOutput size={16} />
              Report
            </Button>
          </div>
        </div>
        {stats.expiringAssets > 0 && (
          <div className="relative z-10 hidden min-w-[260px] rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-md lg:block">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Asset in scadenza</span>
              <Badge variant="secondary" className="border-none bg-orange-500/30 text-orange-100">
                {stats.expiringAssets}
              </Badge>
            </div>
            <p className="text-sm text-blue-100 opacity-70">Verifica prevista entro 30 giorni</p>
            <Button variant="ghost" size="sm" className="mt-3 gap-1 px-0 text-white hover:bg-white/10" onClick={() => navigate('/schedule')}>
              Vedi scadenzario <ChevronRight size={14} />
            </Button>
          </div>
        )}
        <div className="absolute inset-y-0 left-0 w-1/3 bg-slate-900/20" />
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="overflow-hidden rounded-3xl border-none shadow-sm shadow-slate-200/50 transition-all duration-300 hover:shadow-md">
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium tracking-wide text-slate-500">{kpi.label}</p>
                  <p className="text-3xl font-bold text-slate-800">{kpi.value}</p>
                </div>
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl text-white', kpi.color)}>
                  <kpi.icon size={24} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="space-y-8 overflow-hidden rounded-[2rem] border-none bg-white p-8 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold">Trend Manutenzioni</CardTitle>
              <p className="text-xs text-slate-500">WO chiusi negli ultimi 12 mesi</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }} />
                <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={20}>
                  {stats.monthlyTrend.map((_, index) => (
                    <Cell key={index} fill={index === stats.monthlyTrend.length - 1 ? '#2563eb' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="space-y-6 overflow-hidden rounded-[2rem] border-none bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold text-slate-800">Stato Asset</CardTitle>
              <p className="text-xs text-slate-500">Distribuzione per stato operativo</p>
            </div>
            <Layers3 size={20} className="text-primary" />
          </div>
          <div className="h-[240px]">
            {stats.assetStatusBreakdown.every((item) => item.value === 0) ? (
              <ChartEmptyState label="Stato Asset" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.assetStatusBreakdown} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3} strokeWidth={0}>
                    {stats.assetStatusBreakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={ASSET_STATUS_COLORS[index % ASSET_STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}`, 'Asset']} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3">
            {stats.assetStatusBreakdown.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: ASSET_STATUS_COLORS[index % ASSET_STATUS_COLORS.length] }} />
                  <span className="text-sm font-medium text-slate-600">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <Card className="space-y-6 overflow-hidden rounded-[2rem] border-none bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold text-slate-800">Ticket per Categoria</CardTitle>
              <p className="text-xs text-slate-500">Le anomalie piu frequenti segnalate dai dipendenti</p>
            </div>
            <Ticket size={20} className="text-primary" />
          </div>
          <div className="h-[320px]">
            {stats.ticketsByCategory.length === 0 ? (
              <ChartEmptyState label="Ticket per Categoria" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.ticketsByCategory} layout="vertical" margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={130} tick={{ fill: '#475569', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }} />
                  <Bar dataKey="value" fill={CATEGORY_BAR_COLOR} radius={[0, 10, 10, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="space-y-6 overflow-hidden rounded-[2rem] border-none bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold text-slate-800">Ticket per Ubicazione</CardTitle>
              <p className="text-xs text-slate-500">Le aree piu colpite dai malfunzionamenti</p>
            </div>
            <MapPin size={20} className="text-primary" />
          </div>
          <div className="h-[320px]">
            {stats.ticketsByLocation.length === 0 ? (
              <ChartEmptyState label="Ticket per Ubicazione" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.ticketsByLocation} layout="vertical" margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={140} tick={{ fill: '#475569', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }} />
                  <Bar dataKey="value" fill={LOCATION_BAR_COLOR} radius={[0, 10, 10, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="space-y-6 overflow-hidden rounded-[2rem] border-none bg-white p-8 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold text-slate-800">Interventi Attivi</CardTitle>
              <p className="text-xs text-slate-500">Gli ultimi work order ancora in lavorazione</p>
            </div>
            <ClipboardList size={20} className="text-primary" />
          </div>
          <div className="space-y-3">
            {stats.recentWorkOrders.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">Nessun intervento attivo</p>
            )}
            {stats.recentWorkOrders.map((wo) => (
              <div key={wo.id} className="group cursor-pointer rounded-3xl border border-transparent p-4 transition-all hover:border-slate-100 hover:bg-slate-50" onClick={() => navigate('/work-orders')}>
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-bold',
                      wo.priority === 'CRITICAL' || wo.priority === 'HIGH'
                        ? 'bg-red-100 text-red-600'
                        : wo.priority === 'MEDIUM'
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-blue-100 text-blue-600'
                    )}
                  >
                    <AlertTriangle size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">{(wo as any).asset?.name ?? 'Asset'}</p>
                    <p className="truncate text-xs text-slate-500">{wo.description}</p>
                    <Badge variant="outline" className="mt-1 h-4 rounded-md px-2 text-[9px] font-bold uppercase">
                      {WORK_ORDER_STATUS_LABELS[wo.status] ?? wo.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="h-12 w-full gap-2 rounded-2xl font-bold text-primary hover:bg-primary/5" onClick={() => navigate('/work-orders')}>
            Vai alla coda lavori <ArrowRight size={16} />
          </Button>
        </Card>

        <Card className="space-y-6 overflow-hidden rounded-[2rem] border-none bg-white p-8 shadow-sm">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold text-slate-800">Ticket Aperti</CardTitle>
            <p className="text-xs text-slate-500">Controllo rapido della coda segnalazioni</p>
          </div>
          <div className="rounded-[2rem] bg-orange-50 p-6 text-orange-900">
            <p className="text-sm font-medium text-orange-700">Segnalazioni da gestire</p>
            <p className="mt-2 text-5xl font-bold">{stats.openTickets}</p>
            <p className="mt-3 text-sm text-orange-700/80">
              Monitora le richieste in ingresso e trasforma rapidamente i ticket in work order.
            </p>
          </div>
          <Button variant="ghost" className="h-12 w-full gap-2 rounded-2xl font-bold text-primary hover:bg-primary/5" onClick={() => navigate('/tickets')}>
            Vai ai ticket <ArrowRight size={16} />
          </Button>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Button variant="secondary" className="group flex h-36 flex-col items-center justify-center gap-3 rounded-[2rem] border-none bg-primary/5 text-primary hover:bg-primary/10" onClick={() => navigate('/assets')}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 transition-transform group-hover:scale-110">
            <Package size={28} />
          </div>
          <span className="text-sm font-bold">Asset</span>
        </Button>
        <Button variant="secondary" className="group flex h-36 flex-col items-center justify-center gap-3 rounded-[2rem] border-none bg-emerald-50 text-emerald-700 hover:bg-emerald-100" onClick={() => navigate('/work-orders')}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 transition-transform group-hover:scale-110">
            <ClipboardList size={28} />
          </div>
          <span className="text-sm font-bold">Work Orders</span>
        </Button>
        <Button variant="secondary" className="group flex h-36 flex-col items-center justify-center gap-3 rounded-[2rem] border-none bg-orange-50 text-orange-700 hover:bg-orange-100" onClick={() => navigate('/tickets')}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-xl shadow-orange-500/20 transition-transform group-hover:scale-110">
            <Ticket size={28} />
          </div>
          <span className="text-sm font-bold">Tickets</span>
        </Button>
        <Button variant="secondary" className="group flex h-36 flex-col items-center justify-center gap-3 rounded-[2rem] border-none bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={() => navigate('/schedule')}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-700 text-white shadow-xl shadow-slate-700/20 transition-transform group-hover:scale-110">
            <Clock size={28} />
          </div>
          <span className="text-sm font-bold">Scadenzario</span>
        </Button>
      </div>
    </div>
  );
}
