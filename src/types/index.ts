export type AssetStatus = 'SCADUTO' | 'IN SCADENZA' | 'IN REGOLA' | 'IN LAVORAZIONE';
export type WorkOrderStatus = 'NEW' | 'PLANNED' | 'ASSIGNED' | 'IN_PROGRESS' | 'SUSPENDED' | 'CLOSED' | 'VALIDATED' | 'ABANDONED';
export type WorkOrderType = 'PROGRAMMED' | 'CORRECTIVE' | 'EXTRA';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AssetCategory = 'Rivelazione incendi' | 'Antincendio' | 'Meccanico' | 'Elettrico' | 'TVCC';
export type TechnicianEmploymentType = 'INTERNAL' | 'EXTERNAL';
export type AppRole = 'ADMIN' | 'RESPONSABILE' | 'TECNICO' | 'LETTURA';

export interface Facility {
  id: string;
  name: string;
  address: string;
  created_at: string;
}

export interface Location {
  id: string;
  facility_id: string;
  parent_id: string | null;
  name: string;
  description: string;
  qr_code_id: string;
  created_at: string;
}

export interface Asset {
  id: string;
  location_id: string;
  name: string;
  category: AssetCategory;
  brand: string;
  model: string;
  serial_number: string;
  installation_date: string;
  last_verification: string;
  verification_frequency_code: string | null;
  verification_frequency_days: number;
  verification_frequency_months: number;
  status: AssetStatus;
  status_override?: string | null;
  documents: string[];
  created_at: string;
  updated_at: string;
  location?: { name: string } | null;
}

export interface WorkOrder {
  id: string;
  code: string;
  asset_id: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  priority: Priority;
  description: string;
  technician_id: string | null;
  supplier_id: string | null;
  created_at: string;
  planned_date: string | null;
  executed_at: string | null;
  closed_at: string | null;
  validation_date: string | null;
  photos: string[];
  cost: number;
  notes: string;
  report_delivered: boolean;
  report_files: string[];
  asset?: Asset;
  technician?: Technician;
  supplier?: Supplier;
}

export interface Ticket {
  id: string;
  code: string;
  reporter_name: string;
  reporter_email: string;
  location_id: string | null;
  asset_id: string | null;
  problem_category: string | null;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  photo_url: string | null;
  work_order_id: string | null;
  created_at: string;
  location?: { name: string } | null;
  asset?: { name: string } | null;
  work_order?: { id: string; code: string } | null;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  specialization: string | null;
  employment_type: TechnicianEmploymentType;
  supplier_id: string | null;
  supplier?: Supplier | null;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_info: any;
  category: string | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppNotification {
  id: string;
  target_user_id: string;
  title: string;
  message: string;
  type: 'TICKET' | 'WORK_ORDER' | 'SYSTEM';
  entity_type: 'ticket' | 'work_order' | 'system';
  entity_id: string | null;
  read_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
