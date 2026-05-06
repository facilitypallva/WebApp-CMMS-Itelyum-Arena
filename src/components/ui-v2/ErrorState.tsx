import * as React from "react";

import { Button } from "./Button";
import { EmptyState, type EmptyStateProps } from "./EmptyState";

export interface ErrorStateProps
  extends Omit<EmptyStateProps, "icon" | "action" | "title"> {
  title?: React.ReactNode;
  retryLabel?: string;
  onRetry?: () => void;
  action?: React.ReactNode;
}

function ErrorIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function ErrorState({
  action,
  description = "Si e verificato un errore durante il caricamento.",
  onRetry,
  retryLabel = "Riprova",
  title = "Qualcosa non ha funzionato",
  ...props
}: ErrorStateProps) {
  const retryAction = onRetry ? (
    <Button variant="secondary" onClick={onRetry}>
      {retryLabel}
    </Button>
  ) : undefined;

  return (
    <EmptyState
      icon={
        <span className="text-error-text">
          <ErrorIcon />
        </span>
      }
      title={title}
      description={description}
      action={action ?? retryAction}
      {...props}
    />
  );
}
