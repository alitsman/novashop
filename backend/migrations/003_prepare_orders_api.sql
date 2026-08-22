ALTER TABLE orders
ADD COLUMN order_number BIGSERIAL UNIQUE;

ALTER TABLE orders
ALTER COLUMN total_price TYPE NUMERIC(15, 2);

ALTER TABLE order_items
ADD CONSTRAINT order_items_order_product_unique
UNIQUE (order_id, product_id);

CREATE INDEX orders_user_created_idx
ON orders (user_id, created_at DESC, id DESC);
