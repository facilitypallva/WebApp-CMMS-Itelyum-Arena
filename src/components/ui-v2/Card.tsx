import * as React from "react";

import { cn } from "@/lib/utils";

const cardVariants = {
  default: "border-border-default bg-bg-card p-6",
  kpi: "border-border-default bg-bg-card px-6 py-5",
  embedded: "border-transparent bg-bg-surface p-5",
  featured: "border-border-default border-l-primary bg-bg-card px-6 py-5 [border-left-width:3px]",
} as const;

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof cardVariants;
  interactive?: boolean;
}

export function Card({
  children,
  className,
  interactive = false,
  variant = "default",
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border shadow-none",
        interactive &&
          "transition-[border-color,box-shadow] duration-150 hover:border-border-strong hover:shadow-xs",
        cardVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
