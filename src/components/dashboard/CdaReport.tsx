import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, CalendarDays, Building2 } from 'lucide-react';
import arenaOsLogo from '@/assets/arenaos-logo-horizontal.svg';
import arenaOsLogoWhite from '@/assets/arenaos-logo-white.svg';
import { useDashboard } from '@/hooks/useDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WORK_ORDER_STATUS_LABELS } from '@/lib/constants';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

function MetricCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`rounded-xl border p-5 ${tone}`}>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-300">{label}</p>
      <p className="mt-2 text-4xl font-bold text-slate-900 dark:text-slate-50">{value}</p>
    </div>
  );
}

function HorizontalBars({
  title,
  subtitle,
  items,
  barClassName,
}: {
  title: string;
  subtitle: string;
  items: Array<{ name: string; value: number }>;
  barClassName: string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <Card className="rounded-xl border border-slate-200 shadow-none dark:border-slate-700 dark:bg-slate-900/80">
      <CardContent className="space-y-5 p-8">
        <div>
          <CardTitle className="text-xl font-bold text-slate-900">{title}</CardTitle>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800/60">
            Nessun dato disponibile
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-medium text-slate-700">{item.name}</span>
                  <span className="font-bold text-slate-900">{item.value}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full ${barClassName}`}
                    style={{ width: `${Math.max((item.value / max) * 100, 10)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CdaReport() {
  const navigate = useNavigate();
  const { stats, loading } = useDashboard();
  const exportedAt = format(new Date(), "d MMMM yyyy 'alle' HH:mm", { locale: it });

  if (loading || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 print:bg-white">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 14mm;
          }

          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .report-page-break {
            break-before: page;
            page-break-before: always;
          }

          .report-card {
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <div>
            <p className="text-sm font-bold text-slate-900">Report</p>
            <p className="text-sm text-slate-500">Vista dedicata alla stampa e all’esportazione PDF</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => navigate('/')}>
              <ArrowLeft size={14} />
              Torna alla dashboard
            </Button>
            <Button className="rounded-xl gap-2" onClick={() => window.print()}>
              <Printer size={14} />
              Esporta PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-8 print:px-0 print:py-0">
        <section className="report-card arena-card overflow-hidden dark:border-slate-700 dark:bg-slate-900/80">
          <div className="flex flex-col gap-8 border-b border-slate-100 px-8 py-8 md:flex-row md:items-center md:justify-between dark:border-slate-700">
            <div className="flex items-center gap-4">
              <div>
                <img src={arenaOsLogo} alt="ArenaOS" className="h-12 w-auto max-w-[220px] object-contain dark:hidden" />
                <img src={arenaOsLogoWhite} alt="ArenaOS" className="hidden h-12 w-auto max-w-[220px] object-contain dark:block" />
                <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">Report manutenzione impianti</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Documento sintetico con stato manutentivo, criticità aperte e trend operativi della piattaforma.
                </p>
              </div>
            </div>
            <div className="grid gap-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-primary" />
                Data esportazione: <span className="font-semibold text-slate-900">{exportedAt}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-primary" />
                Struttura: <span className="font-semibold text-slate-900">Itelyum Arena - Varese</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-8 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Tot Asset" value={stats.totalAssets.toString()} tone="border-blue-100 bg-blue-50/50 dark:border-blue-400/30 dark:bg-blue-500/15" />
            <MetricCard label="Conformità" value={`${stats.conformanceRate}%`} tone="border-emerald-100 bg-emerald-50/50 dark:border-emerald-400/30 dark:bg-emerald-500/15" />
            <MetricCard label="Asset Scaduti" value={stats.expiredAssets.toString()} tone="border-red-100 bg-red-50/50 dark:border-red-400/30 dark:bg-red-500/15" />
            <MetricCard label="WO In Corso" value={stats.woInProgress.toString()} tone="border-orange-100 bg-orange-50/50 dark:border-orange-400/30 dark:bg-orange-500/15" />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <Card className="report-card rounded-xl border border-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
            <CardContent className="space-y-6 p-8">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Stato asset</CardTitle>
                <p className="mt-1 text-sm text-slate-500">Distribuzione sintetica dello stato manutentivo del patrimonio impiantistico.</p>
              </div>
              <div className="space-y-4">
                {stats.assetStatusBreakdown.map((item) => {
                  const tone =
                    item.name === 'Scaduto'
                      ? 'bg-red-500'
                      : item.name === 'In Scadenza'
                        ? 'bg-orange-500'
                        : 'bg-emerald-500';
                  const width = stats.totalAssets > 0 ? Math.max((item.value / stats.totalAssets) * 100, item.value > 0 ? 8 : 0) : 0;

                  return (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{item.name}</span>
                        <span className="font-bold text-slate-900">{item.value}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="report-card rounded-xl border border-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
            <CardContent className="space-y-6 p-8">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Trend manutenzioni</CardTitle>
                <p className="mt-1 text-sm text-slate-500">Work order chiusi negli ultimi 12 mesi.</p>
              </div>
              <div className="space-y-4">
                {stats.monthlyTrend.map((item) => {
                  const max = Math.max(...stats.monthlyTrend.map((trend) => trend.value), 1);
                  return (
                    <div key={item.name} className="grid grid-cols-[3rem_minmax(0,1fr)_3rem] items-center gap-3 text-sm">
                      <span className="font-medium text-slate-600">{item.name}</span>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full ${item === stats.monthlyTrend[stats.monthlyTrend.length - 1] ? 'bg-primary' : 'bg-slate-300'}`}
                          style={{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 8 : 0)}%` }}
                        />
                      </div>
                      <span className="text-right font-bold text-slate-900">{item.value}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="report-page-break grid grid-cols-1 gap-8 xl:grid-cols-2">
          <HorizontalBars
            title="Ticket per categoria"
            subtitle="Aree di malfunzionamento più frequenti."
            items={stats.ticketsByCategory}
            barClassName="bg-blue-600"
          />
          <HorizontalBars
            title="Ticket per ubicazione"
            subtitle="Zone dell’impianto maggiormente interessate da segnalazioni."
            items={stats.ticketsByLocation}
            barClassName="bg-teal-600"
          />
        </section>

        <section className="grid grid-cols-1 gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="report-card rounded-xl border border-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
            <CardContent className="space-y-6 p-8">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Interventi attivi</CardTitle>
                <p className="mt-1 text-sm text-slate-500">Ultimi work order aperti o in lavorazione.</p>
              </div>
              {stats.recentWorkOrders.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800/60">
                  Nessun intervento attivo
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentWorkOrders.map((workOrder) => (
                    <div key={workOrder.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700 dark:bg-slate-800/45">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{workOrder.code}</span>
                            <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50">
                              {WORK_ORDER_STATUS_LABELS[workOrder.status]}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">{workOrder.description}</p>
                          <p className="text-xs text-slate-500">
                            {workOrder.asset?.name ?? 'Asset non disponibile'}
                            {workOrder.supplier?.name ? ` • ${workOrder.supplier.name}` : ''}
                          </p>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          <p>Creato il</p>
                          <p className="font-semibold text-slate-900">{format(new Date(workOrder.created_at), 'd MMM yyyy', { locale: it })}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="report-card rounded-xl border border-slate-200 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
            <CardContent className="space-y-6 p-8">
              <div>
                <CardTitle className="text-xl font-bold text-slate-900">Sintesi esecutiva</CardTitle>
                <p className="mt-1 text-sm text-slate-500">Messaggi chiave per lettura rapida del report.</p>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                  <p className="text-sm font-semibold text-slate-900">Conformità impianti</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Il parco asset registra una conformità del <span className="font-bold text-slate-900">{stats.conformanceRate}%</span>, con
                    {' '}<span className="font-bold text-red-600">{stats.expiredAssets} asset scaduti</span> e{' '}
                    <span className="font-bold text-orange-600">{stats.expiringAssets} in scadenza</span>.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                  <p className="text-sm font-semibold text-slate-900">Carico operativo</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Sono presenti <span className="font-bold text-slate-900">{stats.woInProgress} work order in corso</span> e{' '}
                    <span className="font-bold text-slate-900">{stats.openTickets} ticket aperti</span> da monitorare.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                  <p className="text-sm font-semibold text-slate-900">Aree critiche</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Le segnalazioni si concentrano soprattutto su{' '}
                    <span className="font-bold text-slate-900">{stats.ticketsByCategory[0]?.name ?? 'nessuna categoria rilevante'}</span>
                    {' '}e nell’area{' '}
                    <span className="font-bold text-slate-900">{stats.ticketsByLocation[0]?.name ?? 'non definita'}</span>.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
