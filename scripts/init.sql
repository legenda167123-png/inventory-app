-- Склады
CREATE TABLE warehouses (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL UNIQUE,
    location    VARCHAR(500),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Номенклатура
CREATE TABLE products (
    id          SERIAL PRIMARY KEY,
    sku         VARCHAR(100) NOT NULL UNIQUE,
    barcode     VARCHAR(100) UNIQUE,
    name        VARCHAR(500) NOT NULL,
    width_mm    NUMERIC(10,2),
    height_mm   NUMERIC(10,2),
    depth_mm    NUMERIC(10,2),
    volume_m3   NUMERIC(12,6),
    weight_kg   NUMERIC(10,3),
    attributes  JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Остатки
CREATE TABLE stock (
    warehouse_id  INT NOT NULL REFERENCES warehouses(id),
    product_id    INT NOT NULL REFERENCES products(id),
    quantity      NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (warehouse_id, product_id)
);

-- Операции
CREATE TABLE operations (
    id                         BIGSERIAL PRIMARY KEY,
    type                       VARCHAR(20) NOT NULL,
    status                     VARCHAR(20) NOT NULL,
    source_warehouse_id        INT REFERENCES warehouses(id),
    destination_warehouse_id   INT REFERENCES warehouses(id),
    created_by                 VARCHAR(200) NOT NULL,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    comment                    TEXT
);

-- Позиции операций
CREATE TABLE operation_items (
    id            BIGSERIAL PRIMARY KEY,
    operation_id  BIGINT NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
    product_id    INT NOT NULL REFERENCES products(id),
    quantity      NUMERIC(14,3) NOT NULL CHECK (quantity > 0),
    UNIQUE (operation_id, product_id)
);

-- Тестовые данные
INSERT INTO warehouses (name, location) VALUES
    ('Основной склад', 'Москва'),
    ('Склад №2', 'Санкт-Петербург');

INSERT INTO products (sku, barcode, name, weight_kg) VALUES
    ('SKU-001', '4600000000011', 'Кружка керамическая', 0.35),
    ('SKU-002', '4600000000028', 'Тарелка 20 см', 0.50);