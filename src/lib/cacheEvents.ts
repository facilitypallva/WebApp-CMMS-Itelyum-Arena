export type CacheEvent = 'work_orders' | 'assets' | 'tickets' | 'technicians' | 'suppliers' | 'vehicles';

const listeners = new Map<CacheEvent, Set<() => void>>();

export function onCacheInvalidated(event: CacheEvent, handler: () => void): () => void {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(handler);

  return () => {
    listeners.get(event)?.delete(handler);
  };
}

export function emitCacheInvalidated(event: CacheEvent): void {
  listeners.get(event)?.forEach((fn) => fn());
}
