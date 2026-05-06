import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      disabled,
      endContent,
      error,
      helperText,
      id,
      label,
      startContent,
      wrapperClassName,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

    return (
      <div className={cn("grid gap-1.5", wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-[13px] font-semibold leading-[18px] text-text-primary"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            "flex h-10 items-center rounded-md border border-border-default bg-bg-card px-3 transition-[border-color,box-shadow] duration-150 focus-within:border-primary focus-within:shadow-[var(--shadow-focus-primary)]",
            error && "border-error-accent focus-within:shadow-[var(--shadow-focus-error)]",
            disabled && "bg-border-default text-text-muted opacity-70"
          )}
        >
          {startContent && (
            <span className="mr-2 flex shrink-0 text-text-muted" aria-hidden="true">
              {startContent}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={describedBy}
            className={cn(
              "min-w-0 flex-1 bg-transparent text-sm font-medium leading-5 text-text-primary outline-none placeholder:text-text-muted disabled:cursor-not-allowed disabled:text-text-muted",
              className
            )}
            {...props}
          />
          {endContent && (
            <span className="ml-2 flex shrink-0 text-text-muted">{endContent}</span>
          )}
        </div>
        {error ? (
          <p id={errorId} className="text-[13px] leading-[18px] text-error-text">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-[13px] leading-[18px] text-text-secondary">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
