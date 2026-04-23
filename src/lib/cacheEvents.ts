export type CacheEvent = 'work_orders' | 'assets' | 'tickets' | 'technicians' | 'suppliers';

const listeners = new Map<CacheEvent, Set<() => void>>();

export function onCacheInvalidated(event: CacheEvent, handler: () => void): void {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(handler);
}

export function emitCacheInvalidated(event: CacheEvent): void {
  listeners.get(event)?.forEach((fn) => fn());
}
