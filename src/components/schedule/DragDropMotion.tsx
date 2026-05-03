import { type DragEvent, type PointerEvent, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface DraggableAssetCardProps {
  children: ReactNode;
  className?: string;
  draggable?: boolean;
  isDragging?: boolean;
  isSelected?: boolean;
  isGrouped?: boolean;
  isDropSuccess?: boolean;
  onPointerDragStart?: (event: PointerEvent<HTMLDivElement>) => void;
}

export function DraggableAssetCard({
  children,
  className,
  draggable = true,
  isDragging = false,
  isSelected = false,
  isGrouped = false,
  isDropSuccess = false,
  onPointerDragStart,
}: DraggableAssetCardProps) {
  return (
    <motion.div
      draggable={false}
      onPointerDownCapture={(event) => {
        if (!draggable || event.button !== 0) return;
        const target = event.target as HTMLElement;
        if (target.closest('button,input,label,[role="checkbox"]')) return;
        event.preventDefault();
        window.getSelection()?.removeAllRanges();
        event.currentTarget.setPointerCapture(event.pointerId);
        onPointerDragStart?.(event);
      }}
      animate={
        isDropSuccess
          ? {
              opacity: [1, 0.95, 0],
              rotate: [-1, -2, 3],
              scale: [1, 1.06, 0],
              y: [0, -3, 8],
            }
          : isDragging
            ? {
                opacity: 0.58,
                rotate: [0, -8, 6, -3, 1, -1],
                scale: [1, 1.015, 1.01, 1.015, 1.01, 1.02],
                y: -2,
                boxShadow: '0 18px 45px rgba(0, 0, 0, 0.32)',
              }
            : {
                opacity: isGrouped ? [1, 0.92, 0.86] : 1,
                rotate: isGrouped ? [0, -2.5, 2, -1.25, 1, 0] : 0,
                scale: isGrouped ? [1, 1.01, 0.99, 0.985] : 1,
                x: isGrouped ? [0, -2, 2, -1, 1, 0] : 0,
                y: 0,
                boxShadow: isSelected
                  ? '0 0 0 1px rgba(39, 229, 140, 0.22)'
                  : '0 0 0 rgba(0, 0, 0, 0)',
              }
      }
      transition={
        isDropSuccess
          ? { duration: 0.4, ease: 'easeInOut' }
          : isDragging
            ? { duration: 0.8, ease: 'easeOut' }
            : isGrouped
              ? { duration: 0.42, ease: 'easeInOut' }
              : { duration: 0.22, ease: 'easeOut' }
      }
      whileHover={draggable && !isDragging && !isDropSuccess ? { y: -2 } : undefined}
      whileTap={draggable && !isDropSuccess ? { scale: 0.985 } : undefined}
      className={cn(
        'group select-none will-change-transform [&_*]:select-none',
        draggable && 'cursor-grab active:cursor-grabbing',
        isDropSuccess && 'pointer-events-none',
        className,
      )}
      style={{ userSelect: 'none' }}
    >
      {children}
    </motion.div>
  );
}

interface BulkSelectionStackProps {
  count: number;
  names: string[];
  onPointerDragStart: (event: PointerEvent<HTMLDivElement>) => void;
  onClear?: () => void;
}

export function BulkSelectionStack({
  count,
  names,
  onPointerDragStart,
  onClear,
}: BulkSelectionStackProps) {
  return (
    <AnimatePresence>
      {count > 1 && (
        <motion.div
          draggable={false}
          onPointerDownCapture={(event) => {
            if (event.button !== 0) return;
            const target = event.target as HTMLElement;
            if (target.closest('button')) return;
            event.preventDefault();
            window.getSelection()?.removeAllRanges();
            event.currentTarget.setPointerCapture(event.pointerId);
            onPointerDragStart(event);
          }}
          initial={{ opacity: 0, y: -10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 480, damping: 32, mass: 0.8 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.985 }}
          className="group relative mx-3 mb-3 mt-1 cursor-grab select-none rounded-[var(--arena-radius-lg)] border border-[var(--arena-accent)]/25 bg-[var(--arena-surface-elevated)] px-4 py-4 shadow-none ring-1 ring-[var(--arena-accent)]/10 active:cursor-grabbing [&_*]:select-none"
          style={{ userSelect: 'none' }}
        >
          <div className="pointer-events-none absolute right-4 top-3 h-12 w-28">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                initial={{ x: -18 + index * 8, y: 4 + index * 3, rotate: -8 + index * 6, opacity: 0 }}
                animate={{ x: index * 8, y: index * 4, rotate: -6 + index * 6, opacity: 1 }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 500, damping: 28 }}
                className="absolute right-0 top-0 h-8 w-20 rounded-[var(--arena-radius-sm)] border border-[var(--arena-border-soft)] bg-[var(--arena-surface)] shadow-none"
              />
            ))}
          </div>
          <div className="relative flex items-center gap-3 pr-24">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--arena-radius-md)] bg-[var(--arena-accent-soft)] text-base font-black text-[var(--arena-accent)]">
              {count}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-[var(--arena-text-primary)]">Gruppo selezionato</p>
              <p className="truncate text-xs font-semibold text-[var(--arena-text-secondary)]">
                {names.slice(0, 3).join(', ')}
                {count > 3 ? ` +${count - 3}` : ''}
              </p>
            </div>
            {onClear && (
              <button
                type="button"
                aria-label="Svuota gruppo"
                onClick={onClear}
                className="absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-[var(--arena-radius-sm)] bg-[var(--arena-surface)] text-xs font-black text-[var(--arena-text-muted)] transition-colors hover:bg-[var(--arena-surface-subtle)] hover:text-[var(--arena-text-primary)]"
              >
                x
              </button>
            )}
          </div>
          <div className="relative mt-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[var(--arena-accent)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--arena-accent)] transition-transform group-hover:scale-125" />
            Trascina il gruppo sul calendario
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface DropCalendarCellProps {
  children: ReactNode;
  className?: string;
  dropDay?: string;
  isDragOver?: boolean;
  onClick?: () => void;
  onDragOver?: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (event: DragEvent<HTMLDivElement>) => void;
  onDrop?: (event: DragEvent<HTMLDivElement>) => void;
}

export function DropCalendarCell({
  children,
  className,
  dropDay,
  isDragOver = false,
  onClick,
  onDragOver,
  onDragLeave,
  onDrop,
}: DropCalendarCellProps) {
  return (
    <motion.div
      data-schedule-drop-day={dropDay}
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      animate={
        isDragOver
          ? {
              scale: 0.985,
              boxShadow: 'inset 0 0 0 2px rgba(39, 229, 140, 0.35), 0 10px 30px rgba(0, 0, 0, 0.22)',
            }
          : {
              scale: 1,
              boxShadow: 'inset 0 0 0 0 rgba(39, 229, 140, 0)',
            }
      }
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={cn('will-change-transform', className)}
    >
      {children}
    </motion.div>
  );
}

interface DragFollowerPreviewProps {
  visible: boolean;
  x: number;
  y: number;
  title: string;
  count?: number;
}

export function DragFollowerPreview({
  visible,
  x,
  y,
  title,
  count = 1,
}: DragFollowerPreviewProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.9, rotate: -8, x: x + 18, y: y + 18 }}
          animate={{ opacity: 0.94, scale: 1, rotate: -2, x: x + 18, y: y + 18 }}
          exit={{ opacity: 0, scale: 0.75, rotate: 3 }}
          transition={{ type: 'spring', stiffness: 520, damping: 34, mass: 0.7 }}
          className="pointer-events-none fixed left-0 top-0 z-[100] w-64 overflow-hidden rounded-[var(--arena-radius-lg)] border border-[var(--arena-accent)]/20 bg-[var(--arena-surface-elevated)]/95 shadow-2xl shadow-black/30 ring-1 ring-black/20 backdrop-blur will-change-transform"
        >
          <div className="flex items-center gap-3 px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--arena-radius-sm)] bg-[var(--arena-accent-soft)] text-sm font-black text-[var(--arena-accent)]">
              {count > 1 ? count : '1'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[var(--arena-text-primary)]">
                {count > 1 ? `${count} asset selezionati` : title}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--arena-text-muted)]">
                Trascina su un giorno
              </p>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-[var(--arena-accent)] via-[#6b7cff] to-[var(--arena-accent)]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
