import test from 'node:test';
import assert from 'node:assert/strict';
import { renderAdmin } from '../src/pages/admin.js';
const products = [
 { id: 'sealed-old', name: 'Sealed archived', active: false, price: 1000 },
 { id: 'sealed', name: 'Sealed active', active: true, price: 1000 },
 { id: 'fresh', name: 'Fresh active', brand: 'baking-stereo', active: true, price: 2000 },
 { id: 'old', name: 'Fresh archived', brand: 'baking-stereo', active: false, price: 2000 },
];
const render = (brand, status = 'all') => renderAdmin({ authenticated: true, view: 'products', products, productFilter: status, productBrandFilter: brand });
test('admin brand filter includes legacy Snackyzz and excludes Baking Stereo', () => {
 const html = render('snackyzz');
 assert.match(html, /Sealed active/);
 assert.doesNotMatch(html, /Fresh active|Fresh archived/);
});
test('admin brand and status filters intersect', () => {
 const html = render('baking-stereo', 'archived');
 assert.match(html, /Fresh archived/);
 assert.doesNotMatch(html, /Sealed active|Sealed archived|Fresh active/);
 const all = render('all');
 for (const product of products) assert.ok(all.includes(product.name));
});
