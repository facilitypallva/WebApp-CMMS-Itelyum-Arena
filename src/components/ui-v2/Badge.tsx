import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = {
  success: "border-success-text/20 bg-success-bg text-success-text [--badge-dot:var(--color-primary)]",
  warning:
    "border-warning-text/20 bg-warning-bg text-warning-text [--badge-dot:var(--color-warning-accent)]",
  error: "border-error-text/20 bg-error-bg text-error-text [--badge-dot:var(--color-error-accent)]",
  neutral: "border-border-default bg-bg-surface text-text-secondary [--badge-dot:var(--color-text-muted)]",
  info: "border-success-text/20 bg-success-bg text-success-text [--badge-dot:var(--color-success-text)]",
  infoDark: "border-bg-sidebar bg-bg-sidebar text-text-on-dark [--badge-dot:var(--color-primary)]",
  criticalSolid: "border-error-text bg-error-text text-white [--badge-dot:#FFFFFF]",
} as const;

const badgeSizes = {
  sm: "min-h-5 px-1.5 py-0.5 text-[10px] leading-3",
  md: "min-h-6 px-2 py-1 text-[11px] leading-[14px]",
} as const;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants;
  size?: keyof typeof badgeSizes;
  dot?: boolean;
}

export function Badge({
  children,
  className,
  dot = false,
  size = "md",
  variant = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-md border font-semibold uppercase tracking-[0.04em]",
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--badge-dot)]"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
