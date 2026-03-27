alter table brands
  add column if not exists platforms text[] default '{}';

alter table brands
  add column if not exists product_category text;

comment on column brands.platforms is 'Social platforms the brand posts on (instagram, tiktok, facebook, salla, shopify, zid)';
comment on column brands.product_category is 'Product category (women, men, kids, accessories, mixed)';
