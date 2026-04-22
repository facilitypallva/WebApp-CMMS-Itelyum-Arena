import { AppRole, Priority, TechnicianEmploymentType, WorkOrderStatus, WorkOrderType } from '@/types';

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  NEW: 'Nuovo',
  PLANNED: 'Pianificato',
  ASSIGNED: 'Assegnato',
  IN_PROGRESS: 'In Corso',
  SUSPENDED: 'Sospeso',
  CLOSED: 'Chiuso',
  VALIDATED: 'Validato',
  ABANDONED: 'Abbandonato',
};

export const WORK_ORDER_TYPE_LABELS: Record<WorkOrderType, string> = {
  PROGRAMMED: 'Programmato',
  CORRECTIVE: 'Correttivo',
  EXTRA: 'Extra',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Bassa',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Critica',
};

export const TECHNICIAN_EMPLOYMENT_LABELS: Record<TechnicianEmploymentType, string> = {
  INTERNAL: 'Interno',
  EXTERNAL: 'Esterno',
};

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  ADMIN: 'Admin',
  RESPONSABILE: 'Responsabile',
  TECNICO: 'Tecnico',
  LETTURA: 'Lettura',
};

export const TICKET_PROBLEM_CATEGORIES = [
  'Elettrico',
  'Idraulico',
  'HVAC / Climatizzazione',
  'Illuminazione',
  'Sicurezza / Antincendio',
  'Strutturale / Edile',
  'Informatica / IT',
  'Pulizia / Igiene',
  'Attrezzature sportive',
  'Altro',
] as const;
