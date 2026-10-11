-- Remove untouched seed products from sale without breaking historical order references.
-- Preserve renamed products, uploaded photos, and manually created products.
update public.products p set active = false
from (values
 ('vanilla-crunch', 'Vanilla Crunch', '/assets/vanilla-crunch.webp'),
 ('double-choco', 'Double Choco', '/assets/double-choco.webp'),
 ('bs-double-chocolate', 'Double Chocolate', '/assets/double-choco.webp'),
 ('bs-white-chocolate', 'White Chocolate', '/assets/vanilla-crunch.webp')
) as seed(id, name, image)
where p.id = seed.id and p.name = seed.name and p.image = seed.image
  and p.description like '%muestra%';
