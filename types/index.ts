export type TripStatus = 'planning' | 'active' | 'completed' | 'archived'
export type MemberRole = 'owner' | 'editor' | 'viewer'
export type EventType =
  | 'flight'
  | 'hotel'
  | 'car_rental'
  | 'activity'
  | 'excursion'
  | 'restaurant'
  | 'transfer'
  | 'custom'
export type ExpenseCategory =
  | 'flights'
  | 'accommodation'
  | 'food'
  | 'activities'
  | 'transport'
  | 'misc'
export type SplitMode = 'equal' | 'exact' | 'percentage' | 'shares'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Trip {
  id: string
  name: string
  destinations: string[]
  start_date: string | null
  end_date: string | null
  cover_photo_url: string | null
  description: string | null
  status: TripStatus
  owner_id: string
  forwarding_address: string | null // Tier 2: email forwarding
  budget: number | null
  budget_currency: string
  share_token: string | null
  created_at: string
  updated_at: string
}

export interface TripMember {
  id: string
  trip_id: string
  user_id: string
  role: MemberRole
  joined_at: string
  profiles?: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'>
}

export interface Event {
  id: string
  trip_id: string
  type: EventType
  title: string
  date: string
  start_time: string | null
  end_time: string | null
  location: string | null
  confirmation_code: string | null
  cost: number | null
  currency: string
  notes: string | null
  data: Record<string, unknown> // type-specific JSONB fields
  created_by: string
  created_at: string
  updated_at: string
}

// Type-specific data shapes stored in Event.data
export interface FlightData {
  airline: string
  flight_number: string
  origin: string // IATA code
  destination: string // IATA code
  departure_time: string
  arrival_time: string
  seat?: string
  class?: string
  terminal?: string
  gate?: string
}

export interface HotelData {
  property_name: string
  address: string
  check_in: string
  check_out: string
  room_type?: string
  guests?: number
}

export interface CarRentalData {
  provider: string
  pickup_location: string
  dropoff_location: string
  vehicle_class?: string
}

export interface Expense {
  id: string
  trip_id: string
  title: string
  amount: number
  currency: string
  amount_home_currency: number | null
  category: ExpenseCategory
  paid_by: string
  date: string
  notes: string | null
  receipt_url: string | null
  event_id: string | null
  created_at: string
}

export interface ExpenseSplit {
  id: string
  expense_id: string
  user_id: string
  amount: number
  split_mode: SplitMode
}

export interface Settlement {
  id: string
  trip_id: string
  from_user_id: string
  to_user_id: string
  amount: number
  currency: string
  method: string | null
  settled_at: string | null
  created_at: string
}

export interface Document {
  id: string
  trip_id: string
  event_id: string | null
  name: string
  file_path: string
  file_type: string
  file_size: number
  parsed_at: string | null
  uploaded_by: string
  created_at: string
}

export interface ActivityFeedItem {
  id: string
  trip_id: string
  user_id: string
  action: string
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  profiles?: Pick<Profile, 'full_name' | 'avatar_url'>
}

// Claude parsing output shape
export interface ParsedEventData {
  type: EventType
  title: string
  date: string
  start_time?: string
  end_time?: string
  location?: string
  confirmation_code?: string
  cost?: number
  currency?: string
  notes?: string
  data: Record<string, unknown>
  confidence: number // 0.0 – 1.0
}

// Lists — Checklist items
export type ChecklistCategory = 'packing' | 'grocery' | 'souvenirs' | 'food_to_try' | 'other'

export interface ChecklistItem {
  id: string
  trip_id: string
  category: ChecklistCategory
  title: string
  notes: string | null
  quantity: number | null
  checked: boolean
  created_by: string
  created_at: string
}

// Lists — Places to Visit
export type PlaceCategory = 'food_drink' | 'things_to_do' | 'nature' | 'shopping' | 'work_friendly'
export type PlaceStatus = 'pending' | 'approved'

export interface Place {
  id: string
  trip_id: string
  category: PlaceCategory
  name: string
  location: string | null
  notes: string | null
  status: PlaceStatus
  rating: number | null
  url: string | null
  created_by: string
  created_at: string
}

// Balance summary for expense tracker
export interface Balance {
  userId: string
  owes: Record<string, number> // userId → amount owed
  owed: Record<string, number> // userId → amount owed to this user
  net: number // positive = owed money, negative = owes money
}
