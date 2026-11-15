import { InputError } from './validation.ts';

export const DELIVERY_TERMS_URL = 'https://paqueticoscr.com/sistema/politica-privacidad.php';
export const DELIVERY_ESTIMATE = 'El plazo estimado de entrega es de 1 a 3 días.';
export const DELIVERY_POLICY_NOTICE = 'Los envíos se realizan mediante Paqueticos CR y se rigen por sus políticas.';
export const DELIVERY_COVERAGE_NOTICE = 'La cobertura y la clasificación de cada zona (GAM o rural) las determina Paqueticos CR.';
export const DELIVERY_TERMS_ERROR = 'Acepta los términos y condiciones de Paqueticos CR para continuar.';

export function validateDeliveryTerms(form: FormData): boolean {
  if (form.get('fulfillmentType') !== 'uber') return false;
  if (form.get('deliveryTermsAccepted') !== 'true') {
    throw new InputError(DELIVERY_TERMS_ERROR);
  }
  return true;
}
