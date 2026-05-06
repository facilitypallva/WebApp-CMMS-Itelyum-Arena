import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = {
  primary:
    "border-transparent bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-pressed focus-visible:shadow-[var(--shadow-focus-primary)]",
  secondary:
    "border-border-default bg-bg-card text-text-primary hover:border-border-strong hover:bg-bg-surface active:bg-border-default focus-visible:border-primary focus-visible:shadow-[var(--shadow-focus-primary)]",
  ghost:
    "border-transparent bg-transparent text-text-primary hover:bg-bg-surface active:bg-border-default focus-visible:shadow-[var(--shadow-focus-primary)]",
  destructive:
    "border-error-bg bg-bg-card text-error-text hover:border-error-accent hover:bg-error-bg focus-visible:shadow-[var(--shadow-focus-error)]",
  destructiveSolid:
    "border-transparent bg-error-accent text-white hover:bg-[#C93E3D] focus-visible:shadow-[var(--shadow-focus-error)]",
  link:
    "h-auto border-transparent bg-transparent p-0 text-success-text underline-offset-4 hover:underline focus-visible:shadow-none",
} as const;

const buttonSizes = {
  sm: "h-8 gap-1.5 rounded-md px-3 text-[13px] leading-[18px]",
  md: "h-9 gap-2 rounded-md px-4 text-sm leading-5",
  lg: "h-11 gap-2 rounded-lg px-5 text-[15px] leading-[22px]",
} as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  isLoading?: boolean;
  loadingLabel?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export function Button({
  children,
  className,
  disabled,
  isLoading = false,
  loadingLabel,
  leadingIcon,
  trailingIcon,
  size = "md",
  type = "button",
  variant = "secondary",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center border font-semibold tracking-[-0.005em] transition-[background-color,border-color,box-shadow,color] duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:bg-border-default disabled:text-text-muted",
        buttonVariants[variant],
        variant !== "link" && buttonSizes[size],
        className
      )}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        leadingIcon
      )}
      {isLoading && loadingLabel ? loadingLabel : children}
      {!isLoading && trailingIcon}
    </button>
  );
}
