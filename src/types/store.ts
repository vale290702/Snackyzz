import type { FormEvent } from "react";
export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  accent: string;
  tag: string;
  description: string;
  brand?: "snackyzz" | "baking-stereo";
  ingredients?: string;
  active?: boolean;
  position?: number;
}
export interface SalesPoint {
  id: string;
  city: string;
  name: string;
  address: string;
  hours: string;
  active?: boolean;
  map_url?: string;
  position?: number;
}
export interface CartLike {
  getQuantity(id: string): number;
  getCount(): number;
  getLines(): { product: Product; quantity: number; total: number }[];
  getFormattedTotal(): string;
}
export interface Contact {
  instagram?: string;
  email?: string;
  whatsapp?: string;
}
export interface Fulfillment {
  type: string;
  pickupLocationId: string;
  deliveryAddress: string;
  deliveryDate: string;
  deliverySlotStart: string;
}
export interface Delivery {
  uberEnabled?: boolean;
  disclaimer?: string;
  slotHours?: number;
  leadHours?: number;
  schedule?: Record<string, { enabled: boolean; start: string; end: string }>;
}
export interface Payment {
  configured: boolean;
  number: string;
  recipient: string;
}
export interface CheckoutDraft {
  name: string;
  email: string;
  phone: string;
}
export interface StoreActions {
  changeQuantity(id: string, delta: number): void;
  openProduct(id: string): void;
  clearCart(): void;
  selectCity(city: string): void;
  copySinpe(): void;
  checkoutChange(name: string, value: string): void;
  receiptChange(file: File | null, input: HTMLInputElement): void;
  submitCheckout(event: FormEvent<HTMLFormElement>): void;
}
export interface CatalogPageProps {
  products: Product[];
  cart: CartLike;
  demoCatalog: boolean;
}
export interface CheckoutProps {
  cart: CartLike;
  payment: Payment;
  contact?: Contact;
  delivery?: Delivery;
  salesPoints?: SalesPoint[];
  fulfillment: Fulfillment;
  demoCatalog: boolean;
  catalogReady: boolean;
  draft: CheckoutDraft;
  receipt: File | null;
  receiptPreview: string;
  checkoutError: string;
  submitting: boolean;
  validatingReceipt: boolean;
}
export interface SuccessProps {
  lastOrder: { id: string; email: string; demo?: boolean } | null;
  contact?: Contact;
}
