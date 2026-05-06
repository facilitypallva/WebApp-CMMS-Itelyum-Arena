import * as React from "react";

import { cn } from "@/lib/utils";

const savingIndicatorConfig = {
  idle: {
    label: "Nessuna modifica",
    className: "text-text-muted",
    dotClassName: "bg-text-muted",
  },
  saving: {
    label: "Salvataggio...",
    className: "text-warning-text",
    dotClassName: "border-warning-accent border-t-transparent",
  },
  saved: {
    label: "Salvato",
    className: "text-success-text",
    dotClassName: "bg-primary",
  },
  error: {
    label: "Errore salvataggio",
    className: "text-error-text",
    dotClassName: "bg-error-accent",
  },
} as const;

export interface SavingIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  status: keyof typeof savingIndicatorConfig;
  label?: React.ReactNode;
}

export function SavingIndicator({
  className,
  label,
  status,
  ...props
}: SavingIndicatorProps) {
  const config = savingIndicatorConfig[status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-[13px] font-semibold leading-[18px]",
        config.className,
        className
      )}
      role="status"
      aria-live="polite"
      {...props}
    >
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          status === "saving" && "animate-spin border-2 bg-transparent",
          config.dotClassName
        )}
        aria-hidden="true"
      />
      {label ?? config.label}
    </div>
  );
}
