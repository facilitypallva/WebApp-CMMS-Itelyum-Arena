export type VehicleStatus = 'disponibile' | 'in_uso' | 'manutenzione' | 'fuori_servizio';
export type AssignmentType = 'staff' | 'giocatore' | 'sharing';
export type DeadlineType = 'assicurazione' | 'revisione' | 'bollo' | 'tagliando';
export type BookingStatus = 'pending' | 'approved' | 'rejected';

type VehicleType = 'auto' | 'furgone' | 'bus' | 'altro';
type FuelType = 'benzina' | 'diesel' | 'elettrico' | 'ibrido' | 'gpl';
type AssignmentCategory = 'staff' | 'giocatore';

export interface Vehicle {
  id: string;
  facility_id: string | null;
  brand: string;
  model: string;
  plate: string;
  year: number | null;
  vehicle_type: VehicleType | null;
  fuel_type: FuelType | null;
  current_km: number | null;
  photo_url: string | null;
  assignment_type: AssignmentType;
  status: VehicleStatus;
  sharing_link_slug: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface VehicleAssignment {
  id: string;
  vehicle_id: string | null;
  assigned_to_name: string;
  assigned_to_role: string | null;
  assignment_category: AssignmentCategory | null;
  season: string | null;
  substitute_vehicle_id: string | null;
  active: boolean | null;
  created_at: string | null;
}

export interface VehicleDeadline {
  id: string;
  vehicle_id: string | null;
  deadline_type: DeadlineType;
  expiry_date: string | null;
  next_km: number | null;
  document_url: string | null;
  notes: string | null;
  created_at: string | null;
}

export interface VehicleMaintenance {
  id: string;
  vehicle_id: string | null;
  maintenance_type: string;
  start_date: string;
  end_date: string;
  notes: string | null;
  completed: boolean | null;
  created_at: string | null;
}

export interface VehicleBooking {
  id: string;
  vehicle_id: string | null;
  booking_code: string | null;
  requester_name: string;
  requester_surname: string;
  requester_email: string;
  departure: string;
  destination: string;
  trip_date: string;
  departure_time: string;
  return_time: string | null;
  reason: string;
  signature_name: string;
  status: BookingStatus;
  fm_notes: string | null;
  created_at: string | null;
}

export type VehicleWithDetails = Vehicle & {
  assignment?: VehicleAssignment;
  deadlines: VehicleDeadline[];
  maintenances: VehicleMaintenance[];
};
