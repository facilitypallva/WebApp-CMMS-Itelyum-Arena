import type { AssetStatus, Priority, WorkOrderStatus, WorkOrderType } from "@/types";
import type { VehicleStatus } from "@/types/vehicles";

export type UiBadgeVariant =
  | "success"
  | "warning"
  | "error"
  | "neutral"
  | "info"
  | "infoDark"
  | "criticalSolid";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";

export type StatusConfig = {
  label: string;
  variant: UiBadgeVariant;
  dot: boolean;
  className?: string;
  description?: string;
};

export type StatusConfigMap<T extends string> = Record<T, StatusConfig>;
export type AssetStatusConfig = typeof assetStatusConfig;
export type WorkOrderStatusConfig = typeof workOrderStatusConfig;
export type WorkOrderPriorityConfig = typeof workOrderPriorityConfig;
export type WorkOrderTypeConfig = typeof workOrderTypeConfig;
export type TicketStatusConfig = typeof ticketStatusConfig;
export type VehicleStatusConfig = typeof vehicleStatusConfig;

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const currencyFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

const numberFormatter = new Intl.NumberFormat("it-IT");

function parseDateValue(value?: string | Date | null): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getInitials(name?: string | null): string {
  const parts = name
    ?.trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts?.length) return "??";

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function formatDate(value?: string | Date | null): string {
  const date = parseDateValue(value);
  return date ? dateFormatter.format(date) : "-";
}

export function formatRelativeDate(value?: string | Date | null): string {
  const date = parseDateValue(value);
  if (!date) return "-";

  const today = startOfLocalDay(new Date());
  const target = startOfLocalDay(date);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) return "Oggi";
  if (diffDays === 1) return "Domani";
  if (diffDays === -1) return "Ieri";
  if (diffDays > 1) return `Tra ${diffDays} giorni`;
  return `${Math.abs(diffDays)} giorni fa`;
}

export function formatCurrency(value?: number | null): string {
  return typeof value === "number" && Number.isFinite(value)
    ? currencyFormatter.format(value)
    : "-";
}

export function formatNumber(value?: number | null): string {
  return typeof value === "number" && Number.isFinite(value)
    ? numberFormatter.format(value)
    : "-";
}

export const assetStatusConfig = {
  "IN REGOLA": {
    label: "In regola",
    variant: "success",
    dot: true,
    description: "Asset conforme e senza scadenze critiche.",
  },
  "IN SCADENZA": {
    label: "In scadenza",
    variant: "warning",
    dot: true,
    description: "Asset con verifica o documento in avvicinamento.",
  },
  SCADUTO: {
    label: "Scaduto",
    variant: "error",
    dot: true,
    description: "Asset con scadenza superata o non conforme.",
  },
  "IN LAVORAZIONE": {
    label: "In lavorazione",
    variant: "infoDark",
    dot: true,
    description: "Asset collegato a intervento operativo attivo.",
  },
} as const satisfies StatusConfigMap<AssetStatus>;

export const workOrderStatusConfig = {
  NEW: {
    label: "Nuovo",
    variant: "neutral",
    dot: true,
    description: "Work order appena creato, non ancora pianificato.",
  },
  PLANNED: {
    label: "Pianificato",
    variant: "neutral",
    dot: true,
    description: "Intervento programmato in calendario.",
  },
  ASSIGNED: {
    label: "Assegnato",
    variant: "info",
    dot: true,
    description: "Intervento assegnato a tecnico o fornitore.",
  },
  IN_PROGRESS: {
    label: "In corso",
    variant: "infoDark",
    dot: true,
    description: "Intervento operativo in lavorazione.",
  },
  SUSPENDED: {
    label: "Sospeso",
    variant: "warning",
    dot: true,
    description: "Intervento temporaneamente sospeso.",
  },
  CLOSED: {
    label: "Chiuso",
    variant: "success",
    dot: true,
    description: "Intervento completato in attesa di validazione.",
  },
  VALIDATED: {
    label: "Validato",
    variant: "success",
    dot: true,
    description: "Intervento chiuso e validato.",
  },
  ABANDONED: {
    label: "Abbandonato",
    variant: "neutral",
    dot: true,
    className: "bg-bg-sidebar text-text-on-dark border-bg-sidebar",
    description: "Intervento interrotto e non completato.",
  },
} as const satisfies StatusConfigMap<WorkOrderStatus>;

export const workOrderPriorityConfig = {
  LOW: {
    label: "Bassa",
    variant: "neutral",
    dot: true,
    description: "Priorita ordinaria.",
  },
  MEDIUM: {
    label: "Media",
    variant: "warning",
    dot: true,
    description: "Priorita intermedia.",
  },
  HIGH: {
    label: "Alta",
    variant: "error",
    dot: true,
    description: "Priorita alta.",
  },
  CRITICAL: {
    label: "Critica",
    variant: "criticalSolid",
    dot: false,
    description: "Priorita massima, richiede attenzione immediata.",
  },
} as const satisfies StatusConfigMap<Priority>;

export const workOrderTypeConfig = {
  PROGRAMMED: {
    label: "Programmato",
    variant: "success",
    dot: false,
    description: "Manutenzione programmata o ricorrente.",
  },
  CORRECTIVE: {
    label: "Correttivo",
    variant: "warning",
    dot: false,
    description: "Intervento correttivo su anomalia o guasto.",
  },
  EXTRA: {
    label: "Extra",
    variant: "infoDark",
    dot: false,
    description: "Attivita extra processo o non pianificata.",
  },
} as const satisfies StatusConfigMap<WorkOrderType>;

export const ticketStatusConfig = {
  OPEN: {
    label: "Aperto",
    variant: "error",
    dot: true,
    description: "Segnalazione ricevuta e non ancora presa in carico.",
  },
  IN_PROGRESS: {
    label: "In lavorazione",
    variant: "infoDark",
    dot: true,
    description: "Segnalazione presa in carico.",
  },
  CLOSED: {
    label: "Chiuso",
    variant: "success",
    dot: true,
    description: "Segnalazione risolta o convertita in intervento.",
  },
} as const satisfies StatusConfigMap<TicketStatus>;

export const vehicleStatusConfig = {
  disponibile: {
    label: "Disponibile",
    variant: "success",
    dot: true,
    description: "Mezzo disponibile per uso o assegnazione.",
  },
  in_uso: {
    label: "In uso",
    variant: "infoDark",
    dot: true,
    description: "Mezzo attualmente assegnato o prenotato.",
  },
  manutenzione: {
    label: "Manutenzione",
    variant: "warning",
    dot: true,
    description: "Mezzo in manutenzione.",
  },
  fuori_servizio: {
    label: "Fuori servizio",
    variant: "error",
    dot: true,
    description: "Mezzo non utilizzabile.",
  },
} as const satisfies StatusConfigMap<VehicleStatus>;
