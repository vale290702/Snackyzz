-- Existing products remain in the Snackyzz catalog. Both brands share orders.
alter table public.products
  add column brand text not null default 'snackyzz'
  constraint products_brand_check check (brand in ('snackyzz', 'baking-stereo'));

-- Explicitly labeled sample cookies; editable through product administration.
insert into public.products(id, name, price, description, tag, image, accent, position, brand) values
('bs-chocolate-chip', 'Chocolate Chip', 2800, 'Cookie con chispas de chocolate. Sabor, precio e imagen de muestra.', 'Producto de muestra', '/assets/choco-cloud.webp', '#ED781A', 4, 'baking-stereo'),
('bs-double-chocolate', 'Double Chocolate', 3000, 'Cookie de doble chocolate. Sabor, precio e imagen de muestra.', 'Producto de muestra', '/assets/double-choco.webp', '#3C1907', 5, 'baking-stereo'),
('bs-white-chocolate', 'White Chocolate', 2800, 'Cookie con chocolate blanco. Sabor, precio e imagen de muestra.', 'Producto de muestra', '/assets/vanilla-crunch.webp', '#D95907', 6, 'baking-stereo')
on conflict (id) do nothing;
