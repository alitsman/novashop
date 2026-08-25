ALTER TABLE order_items
ADD COLUMN line_number INTEGER;

WITH numbered_order_items AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY order_id
      ORDER BY id
    )::INTEGER AS line_number
  FROM order_items
)
UPDATE order_items AS order_item
SET line_number = numbered_order_items.line_number
FROM numbered_order_items
WHERE order_item.id = numbered_order_items.id;

ALTER TABLE order_items
ALTER COLUMN line_number SET NOT NULL;

ALTER TABLE order_items
ADD CONSTRAINT order_items_line_number_positive
CHECK (line_number > 0);

ALTER TABLE order_items
ADD CONSTRAINT order_items_order_line_number_unique
UNIQUE (order_id, line_number);
