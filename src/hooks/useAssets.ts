import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Asset } from '@/types';
import { calculateAssetStatus } from '@/lib/assetUtils';
import { logAudit } from '@/lib/auditLog';
import { useAuth } from '@/contexts/AuthContext';
import { runResilientRequest } from '@/lib/resilientRequest';
import { emitCacheInvalidated, onCacheInvalidated } from '@/lib/cacheEvents';

const ASSETS_CACHE_TTL_MS = 60_000;

let assetsCache: Asset[] | null = null;
let assetsCacheAt = 0;

function enrichAssets(items: Asset[]) {
  return items.map((asset) => ({
    ...asset,
    status: (asset.status_override as import('@/types').AssetStatus | null | undefined)
      ?? calculateAssetStatus(asset.last_verification, asset.verification_frequency_days),
  }));
}

function sortAssets(items: Asset[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'it'));
}

function commitAssetsCache(nextAssets: Asset[]) {
  const committed = sortAssets(enrichAssets(nextAssets));
  assetsCache = committed;
  assetsCacheAt = Date.now();
  return committed;
}

export function invalidateAssetsCache() {
  assetsCache = null;
  assetsCacheAt = 0;
}

onCacheInvalidated('work_orders', invalidateAssetsCache);

async function loadAssetsFromApi() {
  const { data, error } = await runResilientRequest(
    (signal) => supabase
      .from('assets')
      .select('*, location:locations(name)')
      .order('name')
      .abortSignal(signal),
    {
      label: 'assets fetch',
      timeoutMessage: 'Timeout durante il caricamento degli asset',
    }
  );

  if (error) {
    throw error;
  }

  return commitAssetsCache((data ?? []) as Asset[]);
}

export function useAssets(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(enabled && !assetsCache);

  const fetchAssets = useCallback(async (force = false) => {
    if (!enabled) {
      setLoading(false);
      return [];
    }

    const hasFreshCache = assetsCache && Date.now() - assetsCacheAt < ASSETS_CACHE_TTL_MS;

    if (!force && assetsCache) {
      setAssets(assetsCache);
      setLoading(false);
      if (hasFreshCache) return assetsCache;
    } else {
      setLoading(true);
    }

    const freshAssets = await loadAssetsFromApi();
    setAssets(freshAssets);
    setLoading(false);
    return freshAssets;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setAssets([]);
      setLoading(false);
      return;
    }

    fetchAssets().catch(console.error);
  }, [enabled, fetchAssets]);

  const createAsset = async (payload: Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
    const { data, error } = await runResilientRequest(
      (signal) => supabase.from('assets').insert(payload).select('*, location:locations(name)').abortSignal(signal).single(),
      {
        label: 'asset create',
        timeoutMessage: 'Timeout durante il salvataggio dell\'asset',
      }
    );
    if (error) return { error };
    if (data) {
      const nextAssets = commitAssetsCache([...(assetsCache ?? []), data as Asset]);
      setAssets(nextAssets);
      emitCacheInvalidated('assets');
      if (user) logAudit(user.id, 'CREATE', 'assets', data.id, null, data);
    }
    return { error: null };
  };

  const updateAsset = async (id: string, payload: Partial<Asset>) => {
    const old = assets.find((a) => a.id === id);
    const nextUpdatedAt = new Date().toISOString();
    const nextPayload = { ...payload, updated_at: nextUpdatedAt };
    const { error } = await runResilientRequest(
      (signal) => supabase
        .from('assets')
        .update(nextPayload)
        .eq('id', id)
        .abortSignal(signal),
      {
        label: 'asset update',
        timeoutMessage: 'Timeout durante l\'aggiornamento dell\'asset',
      }
    );
    if (error) return { error };
    const baseAssets = assetsCache ?? assets;
    const nextAssets = commitAssetsCache(
      baseAssets.map((asset) => (asset.id === id ? { ...asset, ...nextPayload } : asset))
    );
    setAssets(nextAssets);
    emitCacheInvalidated('assets');
    if (user) logAudit(user.id, 'UPDATE', 'assets', id, old ?? null, payload);
    return { error: null };
  };

  const deleteAsset = async (id: string) => {
    const old = assets.find((a) => a.id === id);
    const previousAssets = assetsCache ?? assets;
    const optimisticAssets = commitAssetsCache(previousAssets.filter((asset) => asset.id !== id));
    setAssets(optimisticAssets);
    const { error } = await runResilientRequest(
      (signal) => supabase.from('assets').delete().eq('id', id).abortSignal(signal),
      {
        label: 'asset delete',
        timeoutMessage: 'Timeout durante l\'eliminazione dell\'asset',
      }
    );
    if (error) {
      const restoredAssets = commitAssetsCache(previousAssets);
      setAssets(restoredAssets);
      return { error };
    }
    emitCacheInvalidated('assets');
    if (user) logAudit(user.id, 'DELETE', 'assets', id, old ?? null, null);
    return { error: null };
  };

  return { assets, loading, fetchAssets, createAsset, updateAsset, deleteAsset };
}
