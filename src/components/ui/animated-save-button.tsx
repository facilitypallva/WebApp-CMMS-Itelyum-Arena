import { type ComponentProps, type ReactNode, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Loader2, Save, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SAVE_SUCCESS_FEEDBACK_MS } from '@/lib/saveFeedback';

export type AnimatedSaveButtonState = 'idle' | 'saving' | 'success' | 'error';

interface AnimatedSaveButtonProps extends Omit<ComponentProps<typeof Button>, 'children'> {
  state?: AnimatedSaveButtonState;
  isSaving?: boolean;
  idleLabel?: string;
  savingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
  idleIcon?: ReactNode;
}

const stateClasses: Record<AnimatedSaveButtonState, string> = {
  idle: 'bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90',
  saving: 'bg-slate-600 text-white shadow-slate-900/20 hover:bg-slate-600',
  success: 'bg-emerald-600 text-white shadow-emerald-600/25 hover:bg-emerald-600',
  error: 'bg-red-600 text-white shadow-red-600/25 hover:bg-red-600',
};

function SaveStateIcon({
  state,
  idleIcon,
}: {
  state: AnimatedSaveButtonState;
  idleIcon?: ReactNode;
}) {
  if (state === 'saving') {
    return <Loader2 size={16} className="animate-spin" />;
  }

  if (state === 'success') {
    return <Check size={16} className="animate-in zoom-in-50 duration-200" />;
  }

  if (state === 'error') {
    return <TriangleAlert size={16} />;
  }

  return idleIcon ?? <Save size={16} />;
}

export function AnimatedSaveButton({
  state,
  isSaving = false,
  idleLabel = 'Salva',
  savingLabel = 'Salvataggio...',
  successLabel = 'Salvato',
  errorLabel = 'Errore',
  idleIcon,
  className,
  disabled,
  ...props
}: AnimatedSaveButtonProps) {
  const [transientSuccess, setTransientSuccess] = useState(false);
  const wasSavingRef = useRef(false);

  useEffect(() => {
    if (state) return;

    if (wasSavingRef.current && !isSaving) {
      setTransientSuccess(true);
      const timeoutId = window.setTimeout(() => {
        setTransientSuccess(false);
      }, SAVE_SUCCESS_FEEDBACK_MS);

      wasSavingRef.current = isSaving;
      return () => window.clearTimeout(timeoutId);
    }

    if (isSaving) {
      setTransientSuccess(false);
    }

    wasSavingRef.current = isSaving;
  }, [isSaving, state]);

  const visualState = state ?? (transientSuccess ? 'success' : isSaving ? 'saving' : 'idle');
  const label = visualState === 'saving'
    ? savingLabel
    : visualState === 'success'
      ? successLabel
      : visualState === 'error'
        ? errorLabel
        : idleLabel;

  return (
    <Button
      aria-busy={visualState === 'saving'}
      disabled={disabled || visualState === 'saving' || visualState === 'success'}
      className={cn(
        'relative min-h-11 min-w-[9.75rem] overflow-hidden rounded-xl px-5 font-black shadow-lg transition-[background,box-shadow,transform,opacity] duration-200 hover:-translate-y-0.5 active:translate-y-px disabled:opacity-80',
        className,
        stateClasses[visualState],
        visualState === 'success' && 'animate-in zoom-in-95 duration-300',
        visualState === 'error' && 'animate-shake',
      )}
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={`${visualState}-${label}`}
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.96 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="inline-flex items-center justify-center gap-2"
        >
          <SaveStateIcon state={visualState} idleIcon={idleIcon} />
          <span>{label}</span>
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
