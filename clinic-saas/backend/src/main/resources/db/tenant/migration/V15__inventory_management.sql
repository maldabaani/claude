CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'MEDICATION',
    sku VARCHAR(100) UNIQUE,
    unit VARCHAR(50) NOT NULL DEFAULT 'units',
    current_stock INTEGER NOT NULL DEFAULT 0,
    minimum_stock INTEGER NOT NULL DEFAULT 0,
    unit_cost NUMERIC(10,2),
    supplier VARCHAR(200),
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    transaction_type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    notes TEXT,
    performed_by UUID,
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_inv_transactions_item ON inventory_transactions(item_id);
