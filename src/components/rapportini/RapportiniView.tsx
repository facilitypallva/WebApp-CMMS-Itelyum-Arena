import React, { useEffect, useState, useMemo } from 'react';
import { FolderOpen, Folder, FileText, Download, Trash2, ChevronRight, ChevronDown, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { runResilientRequest, withRequestTimeout } from '@/lib/resilientRequest';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const BUCKET = 'rapportini';

interface WOEntry {
  id: string;
  code: string;
  description: string;
  asset_id: string;
  report_files: string[];
  created_at: string;
}

interface AssetMeta {
  id: string;
  name: string;
  serial_number: string | null;
  category: string;
}

interface AssetGroup {
  asset: AssetMeta;
  wos: WOEntry[];
  totalFiles: number;
}

type WorkOrderRow = WOEntry & {
  asset: AssetMeta[] | AssetMeta | null;
};

function fileNameFromPath(path: string) {
  return path.split('/').pop() ?? path;
}

function fileIcon(name: string) {
  if (name.endsWith('.pdf')) return '📄';
  if (name.match(/\.(jpg|jpeg|png|webp)$/i)) return '🖼️';
  return '📎';
}

export function RapportiniView() {
  const { role } = useAuth();
  const canDelete = role === 'ADMIN' || role === 'RESPONSABILE';

  const [wos, setWos] = useState<WOEntry[]>([]);
  const [assetsMap, setAssetsMap] = useState<Map<string, AssetMeta>>(new Map());
  const [loading, setLoading] = useState(true);
  const [openAssets, setOpenAssets] = useState<Set<string>>(new Set());
  const [openWos, setOpenWos] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    const { data: woData } = await supabase
      .from('work_orders')
      .select('id, code, description, asset_id, report_files, created_at, asset:assets(id, name, serial_number, category)')
      .order('created_at', { ascending: false });

    const rows = (woData ?? []) as WorkOrderRow[];
    const withFiles = rows.filter((w) => w.report_files?.length > 0);
    const map = new Map<string, AssetMeta>();
    for (const w of withFiles) {
      const asset = Array.isArray(w.asset) ? w.asset[0] : w.asset;
      if (asset) map.set(w.asset_id, asset);
    }
    setWos(withFiles.map(({ asset: _asset, ...wo }) => wo));
    setAssetsMap(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const groups = useMemo((): AssetGroup[] => {
    const byAsset = new Map<string, WOEntry[]>();
    for (const wo of wos) {
      if (!byAsset.has(wo.asset_id)) byAsset.set(wo.asset_id, []);
      byAsset.get(wo.asset_id)!.push(wo);
    }
    const result: AssetGroup[] = [];
    byAsset.forEach((woList, assetId) => {
      const asset = assetsMap.get(assetId) ?? { id: assetId, name: 'Asset sconosciuto', serial_number: null, category: '' };
      result.push({ asset, wos: woList, totalFiles: woList.reduce((s, w) => s + w.report_files.length, 0) });
    });
    return result.sort((a, b) => a.asset.name.localeCompare(b.asset.name));
  }, [wos, assetsMap]);

  const toggleAsset = (id: string) =>
    setOpenAssets((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleWo = (id: string) =>
    setOpenWos((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleDownload = async (path: string) => {
    try {
      const { data, error } = await withRequestTimeout(
        () => supabase.storage.from(BUCKET).createSignedUrl(path, 60),
        10_000,
        'Timeout nella generazione del link'
      );
      if (error || !data?.signedUrl) { toast.error('Impossibile aprire il file'); return; }
      window.open(data.signedUrl, '_blank');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossibile aprire il file');
    }
  };

  const handleDelete = async (wo: WOEntry, path: string) => {
    if (!confirm(`Eliminare "${fileNameFromPath(path)}"?`)) return;
    try {
      const { error: storageError } = await withRequestTimeout(
        () => supabase.storage.from(BUCKET).remove([path]),
        15_000,
        'Timeout nella rimozione del file'
      );
      if (storageError) { toast.error('Errore nella rimozione'); return; }

      const nextFiles = wo.report_files.filter((f) => f !== path);
      const { error: dbError } = await runResilientRequest(
        (signal) => supabase.from('work_orders').update({ report_files: nextFiles }).eq('id', wo.id).abortSignal(signal),
        { label: 'rapportini delete', timeoutMessage: 'File rimosso ma errore nel salvataggio' }
      );
      if (dbError) {
        toast.error('File rimosso dallo storage ma errore nel salvataggio: ricaricare la pagina');
        return;
      }

      toast.success('File eliminato');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore nella rimozione del file');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="arena-card text-center py-20 text-slate-400">
        <Archive size={48} className="mx-auto mb-4 opacity-30" />
        <p className="font-bold text-slate-600 text-lg">Nessun rapportino allegato</p>
        <p className="text-sm mt-1">I rapportini allegati ai Work Order appariranno qui</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map(({ asset, wos: assetWos, totalFiles }) => {
        const assetOpen = openAssets.has(asset.id);
        return (
          <div key={asset.id} className="arena-card overflow-hidden">
            {/* Asset row */}
            <button
              onClick={() => toggleAsset(asset.id)}
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50/70 transition-colors text-left"
            >
              {assetOpen
                ? <FolderOpen size={22} className="text-primary shrink-0" />
                : <Folder size={22} className="text-slate-400 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate">{asset.name}</p>
                <p className="text-xs text-slate-400">
                  {asset.serial_number && <span className="font-mono">{asset.serial_number} · </span>}
                  {asset.category} · {assetWos.length} {assetWos.length === 1 ? 'intervento' : 'interventi'} · {totalFiles} {totalFiles === 1 ? 'file' : 'file'}
                </p>
              </div>
              {assetOpen
                ? <ChevronDown size={16} className="text-slate-400 shrink-0" />
                : <ChevronRight size={16} className="text-slate-400 shrink-0" />}
            </button>

            {/* WO list */}
            {assetOpen && (
              <div className="border-t border-slate-100">
                {assetWos.map((wo) => {
                  const woOpen = openWos.has(wo.id);
                  return (
                    <div key={wo.id} className="border-b border-slate-50 last:border-b-0">
                      {/* WO row */}
                      <button
                        onClick={() => toggleWo(wo.id)}
                        className="w-full flex items-center gap-4 pl-12 pr-6 py-3.5 hover:bg-slate-50/60 transition-colors text-left"
                      >
                        <FileText size={16} className={cn('shrink-0', woOpen ? 'text-primary' : 'text-slate-400')} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 tracking-widest">{wo.code}</span>
                            <span className="text-sm font-semibold text-slate-700 truncate">{wo.description}</span>
                          </div>
                          <p className="text-xs text-slate-400">
                            {format(new Date(wo.created_at), 'd MMM yyyy', { locale: it })} · {wo.report_files.length} {wo.report_files.length === 1 ? 'allegato' : 'allegati'}
                          </p>
                        </div>
                        {woOpen
                          ? <ChevronDown size={14} className="text-slate-400 shrink-0" />
                          : <ChevronRight size={14} className="text-slate-400 shrink-0" />}
                      </button>

                      {/* Files */}
                      {woOpen && (
                        <div className="bg-slate-50/50 border-t border-slate-50">
                          {wo.report_files.map((path) => {
                            const name = fileNameFromPath(path);
                            return (
                              <div key={path} className="flex items-center gap-3 pl-20 pr-6 py-2.5 border-b border-slate-100/70 last:border-b-0 hover:bg-white/60 transition-colors">
                                <span className="text-base shrink-0">{fileIcon(name)}</span>
                                <span className="flex-1 text-sm font-medium text-slate-700 truncate">{name}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5"
                                    title="Scarica"
                                    onClick={() => handleDownload(path)}
                                  >
                                    <Download size={14} />
                                  </Button>
                                  {canDelete && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                                      title="Elimina"
                                      onClick={() => handleDelete(wo, path)}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
