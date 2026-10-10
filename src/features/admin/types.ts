import type {
  Product as StoreProduct,
  SalesPoint as StoreSalesPoint,
} from "../../types/store";
export interface Product extends StoreProduct {
  active: boolean;
  position: number;
}
export interface SalesPoint extends StoreSalesPoint {
  position: number;
  map_url: string;
}
export interface ScheduleDay {
  enabled: boolean;
  start: string;
  end: string;
}
export interface Settings {
  demo_catalog?: boolean;
  sinpe_number?: string;
  sinpe_recipient?: string;
  whatsapp?: string;
  public_email?: string;
  instagram?: string;
  uber_delivery_enabled?: boolean;
  delivery_lead_hours?: number;
  delivery_slot_hours?: number;
  delivery_schedule?: Record<string, ScheduleDay>;
  uber_disclaimer?: string;
}
export interface Order {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  emailStatus: string;
  total: number;
  createdAt: string;
  confirmedAt?: string;
  receiptUrl: string;
  fulfillmentType?: string;
  fulfillmentLabel?: string;
  fulfillmentAddress?: string;
  deliveryDate?: string;
  deliverySlotStart?: string;
  deliverySlotEnd?: string;
  items: { name: string; price: number; quantity: number }[];
}
export interface AdminState {
  formRevision?: number;
  authenticated: boolean;
  loaded: boolean;
  loading: boolean;
  busy: boolean;
  orders: Order[];
  products: Product[];
  settings: Settings | null;
  locations: SalesPoint[];
  emailConfigured: boolean;
  editingLocation: string | null;
  view: string;
  productFilter: string;
  productBrandFilter: string;
  editingProduct: string | null;
  filter: string;
  search: string;
  selected: string | null;
  error: string;
}
export interface StoreResponse {
  settings: Settings;
  locations: SalesPoint[];
  emailConfigured: boolean;
}
