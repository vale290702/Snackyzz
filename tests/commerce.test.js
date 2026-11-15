import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePackages, validatePromotion} from '../supabase/functions/_shared/commerce.js';
test('package definitions reject duplicates, decimals, invalid prices and excessive quantities', () => {
  assert.deepEqual(validatePackages([{quantity:3,price:2000}]), [{quantity:3,price:2000}]);
  for (const value of [[{quantity:1,price:100}], [{quantity:3.5,price:100}], [{quantity:100,price:100}], [{quantity:3,price:0}], [{quantity:3,price:2.5}], [{quantity:3,price:100},{quantity:3,price:200}], {}]) assert.throws(()=>validatePackages(value));
});
test('Espinal promotion requires delivery and an explicit residence confirmation', () => {
  assert.equal(validatePromotion(' espinalsnackyzz ', 'uber', true), 'EspinalSnackyzz');
  assert.equal(validatePromotion('', 'pickup', false), '');
  assert.throws(()=>validatePromotion('other', 'uber', true));
  assert.throws(()=>validatePromotion('EspinalSnackyzz', 'pickup', true));
  assert.throws(()=>validatePromotion('EspinalSnackyzz', 'uber', false));
});
