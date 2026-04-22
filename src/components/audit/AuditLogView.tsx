import React, { useEffect, useState } from 'react';
import { ShieldCheck, Plus, Edit, Trash2, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface AuditEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_value: any;
  new_value: any;
  created_at: string;
}

type ProfileMap = Record<string, string>;

const ACTION_CONFIG: Record<string, { label: string; cls: string; Icon: any }> = {
  CREATE: { label: 'Creazione', cls: 'bg-emerald-100 text-emerald-700', Icon: Plus },
  UPDATE: { label: 'Modifica', cls: 'bg-blue-100 text-blue-700', Icon: Edit },
  DELETE: { label: 'Eliminazione', cls: 'bg-red-100 text-red-700', Icon: Trash2 },
};

const ENTITY_LABELS: Record<string, string> = {
  assets: 'Asset', work_orders: 'Work Order', tickets: 'Ticket',
};

function getDisplayName(entry: AuditEntry) {
  return entry.new_value?.code ?? entry.old_value?.code ?? entry.new_value?.name ?? entry.old_value?.name ?? entry.entity_id.slice(0, 8);
}

function exportToCsv(entries: AuditEntry[], profileMap: ProfileMap) {
  const header = ['Data/Ora', 'Utente', 'Azione', 'Tipo', 'Identificativo'];
  const rows = entries.map((e) => [
    format(new Date(e.created_at), 'd MMM yyyy HH:mm', { locale: it }),
    profileMap[e.user_id] ?? e.user_id,
    ACTION_CONFIG[e.action]?.label ?? e.action,
    ENTITY_LABELS[e.entity_type] ?? e.entity_type,
    getDisplayName(e),
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AuditLogView() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [profileMap, setProfileMap] = useState<ProfileMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      const rows = (data ?? []) as AuditEntry[];
      setEntries(rows);

      if (rows.length > 0) {
        const userIds = [...new Set(rows.map((r) => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        const map: ProfileMap = {};
        for (const p of profiles ?? []) {
          map[p.id] = p.full_name ?? p.email;
        }
        setProfileMap(map);
      }

      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-4">
      {!loading && entries.length > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => exportToCsv(entries, profileMap)}>
            <Download size={16} />
            Esporta Excel
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl text-slate-400">
          <ShieldCheck size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-medium">Nessuna attività registrata</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-100">
          {entries.map((entry, idx) => {
            const cfg = ACTION_CONFIG[entry.action] ?? ACTION_CONFIG.UPDATE;
            const Icon = cfg.Icon;
            const userName = profileMap[entry.user_id] ?? 'Utente sconosciuto';
            return (
              <div key={entry.id} className={cn('flex items-start gap-4 px-8 py-5 hover:bg-slate-50/50 transition-colors', idx > 0 && 'border-t border-slate-50')}>
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5', cfg.cls)}>
                  <Icon size={15} />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={cn(cfg.cls, 'border-none text-[10px] font-bold rounded-md px-2')}>{cfg.label}</Badge>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {ENTITY_LABELS[entry.entity_type] ?? entry.entity_type}
                    </span>
                    <span className="text-sm font-bold text-slate-800">{getDisplayName(entry)}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {format(new Date(entry.created_at), 'd MMM yyyy • HH:mm', { locale: it })}
                    {' · '}
                    <span className="font-medium text-slate-500">{userName}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
