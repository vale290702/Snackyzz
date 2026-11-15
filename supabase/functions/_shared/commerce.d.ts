export type CookiePackage = { quantity: number; price: number };
export function validatePackages(value?: unknown): CookiePackage[];
export function productTotal(product: {price: number; packages?: CookiePackage[]}, quantity: number): number;
export function validatePromotion(code: unknown, fulfillmentType: string, espinalResident?: boolean): string;
