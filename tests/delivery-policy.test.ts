import { describe, expect, it } from 'vitest';
import { validateDeliveryTerms } from '../supabase/functions/_shared/delivery-policy';

function form(type: string, accepted?: string) {
  const data = new FormData();
  data.set('fulfillmentType', type);
  if (accepted !== undefined) data.set('deliveryTermsAccepted', accepted);
  return data;
}

describe('Paqueticos delivery acceptance', () => {
  it.each([undefined, '', 'false', 'on'])('rejects delivery without explicit acceptance (%s)', accepted => {
    expect(() => validateDeliveryTerms(form('uber', accepted))).toThrow('Acepta los términos y condiciones de Paqueticos CR para continuar.');
  });
  it('accepts delivery when explicitly checked', () => {
    expect(validateDeliveryTerms(form('uber', 'true'))).toBe(true);
  });
  it('does not require or carry delivery acceptance for pickup', () => {
    expect(validateDeliveryTerms(form('pickup'))).toBe(false);
    expect(validateDeliveryTerms(form('pickup', 'true'))).toBe(false);
  });
});
