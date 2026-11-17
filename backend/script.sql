-- =========================================
-- 1. COUNTRIES
-- =========================================

CREATE TABLE countries (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- =========================================
-- 2. CITIES
-- =========================================

CREATE TABLE cities (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country_id VARCHAR(36) NOT NULL,

    FOREIGN KEY (country_id) REFERENCES countries(id)
);

-- =========================================
-- 3. BANKS
-- =========================================

CREATE TABLE banks (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country_id VARCHAR(36) NOT NULL,

    FOREIGN KEY (country_id) REFERENCES countries(id)
);

-- =========================================
-- 4. OWNERS
-- =========================================

CREATE TABLE owners (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150) NOT NULL,

    -- Bank account where the owner receives the net amount of the rentals
    bank_id VARCHAR(36) NOT NULL,
    account_number VARCHAR(30) NOT NULL,
    account_type VARCHAR(50) NOT NULL,

    -- Net amount (90%) received from the rentals of the owner's properties
    balance DECIMAL(12,2) NOT NULL DEFAULT 0,

    FOREIGN KEY (bank_id) REFERENCES banks(id),
    CONSTRAINT CHK_owners_balance CHECK (balance >= 0),
    CONSTRAINT UQ_owners_bank_account UNIQUE (bank_id, account_number)
);

CREATE UNIQUE INDEX UQ_owners_email_lower ON owners (LOWER(email));

-- =========================================
-- 5. CLIENTS
-- =========================================

CREATE TABLE clients (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150) NOT NULL,

    -- City where the client lives
    city_id VARCHAR(36) NOT NULL,

    -- Bank account the client pays from. Payments are simulated (no
    -- gateway), so the app does not keep a client balance
    bank_id VARCHAR(36) NOT NULL,
    account_number VARCHAR(30) NOT NULL,
    account_type VARCHAR(50) NOT NULL,

    FOREIGN KEY (city_id) REFERENCES cities(id),
    FOREIGN KEY (bank_id) REFERENCES banks(id),

    CONSTRAINT UQ_clients_bank_account UNIQUE (bank_id, account_number)
);

CREATE UNIQUE INDEX UQ_clients_email_lower ON clients (LOWER(email));

-- =========================================
-- 6. ADMINISTRATORS
-- =========================================

-- Receives the payment of every rental, keeps a 10% commission and passes
-- the rest to the owner
CREATE TABLE administrators (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150) NOT NULL,

    -- Bank account that receives the payments
    bank_id VARCHAR(36) NOT NULL,
    account_number VARCHAR(30) NOT NULL,
    account_type VARCHAR(50) NOT NULL,

    -- Accumulated commissions
    balance DECIMAL(12,2) NOT NULL DEFAULT 0,

    FOREIGN KEY (bank_id) REFERENCES banks(id),
    CONSTRAINT CHK_administrators_balance CHECK (balance >= 0)
);

-- There is a single administrator: a unique index on a constant allows
-- only one row
CREATE UNIQUE INDEX UQ_administrators_single ON administrators ((TRUE));

-- =========================================
-- 7. PROPERTIES
-- =========================================

CREATE TABLE properties (
    id VARCHAR(36) PRIMARY KEY,
    address VARCHAR(200) NOT NULL,
    area DECIMAL(10,2) NOT NULL,
    number_of_rooms INT NOT NULL,
    capacity INT NOT NULL,
    price_per_night DECIMAL(12,2) NOT NULL,

    -- Owner of the property
    owner_id VARCHAR(36) NOT NULL,

    -- City where the property is located
    city_id VARCHAR(36) NOT NULL,

    manually_inactive BOOLEAN NOT NULL DEFAULT FALSE,

    FOREIGN KEY (owner_id) REFERENCES owners(id),
    FOREIGN KEY (city_id) REFERENCES cities(id)
);

-- =========================================
-- 8. RENTALS
-- =========================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE rentals (
    property_id VARCHAR(36) NOT NULL,
    client_id VARCHAR(36) NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,

    -- Rental cost (nights × price per night), paid by the client
    charged_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'UPCOMING',

    PRIMARY KEY (property_id, client_id, check_in_date),

    FOREIGN KEY (property_id) REFERENCES properties(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),

    CONSTRAINT CHK_rentals_dates CHECK (check_out_date > check_in_date),
    CONSTRAINT CHK_rentals_status CHECK (status IN ('UPCOMING', 'ACTIVE', 'FINISHED')),

    -- Safety net: the domain already rejects overlapping rentals
    CONSTRAINT EXCL_rentals_property_period
        EXCLUDE USING gist (
            property_id WITH =,
            daterange(check_in_date, check_out_date, '[]') WITH &&
        ),

    CONSTRAINT EXCL_rentals_client_period
        EXCLUDE USING gist (
            client_id WITH =,
            daterange(check_in_date, check_out_date, '[]') WITH &&
        )
);

-- =========================================
-- 9. ADMINISTRATOR ↔ OWNER TRANSACTIONS
-- =========================================

-- One row per money movement between the administrator and an owner.
-- Rows are only inserted: a cancellation adds a REFUND, it does not delete
-- the PAYMENT. There is no reference to the rental on purpose.
CREATE TABLE administrator_owner_transactions (
    id VARCHAR(36) PRIMARY KEY,
    administrator_id VARCHAR(36) NOT NULL,
    owner_id VARCHAR(36) NOT NULL,
    type VARCHAR(10) NOT NULL,

    -- What the client paid
    gross_amount DECIMAL(12,2) NOT NULL,
    -- What the administrator keeps (10%)
    commission DECIMAL(12,2) NOT NULL,
    -- What the owner receives
    net_amount DECIMAL(12,2) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (administrator_id) REFERENCES administrators(id),
    FOREIGN KEY (owner_id) REFERENCES owners(id),

    CONSTRAINT CHK_aot_type CHECK (type IN ('PAYMENT', 'REFUND')),
    CONSTRAINT CHK_aot_amounts CHECK (
        gross_amount > 0
        AND commission >= 0
        AND net_amount >= 0
        AND net_amount = gross_amount - commission
    )
);

-- Earnings and detail by owner
CREATE INDEX IX_aot_owner_created_at
    ON administrator_owner_transactions (owner_id, created_at);

-- =========================================
-- SEED DATA
-- =========================================

-- =========================================
-- 10. COUNTRIES
-- =========================================

INSERT INTO countries (id, name) VALUES
    ('11111111-1111-4111-8111-111111111111', 'Colombia'),
    ('22222222-2222-4222-8222-222222222222', 'México'),
    ('33333333-3333-4333-8333-333333333333', 'España')
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- 11. CITIES
-- =========================================

INSERT INTO cities (id, name, country_id) VALUES
    ('c0000000-0000-4000-8000-000000000001', 'Bogotá', '11111111-1111-4111-8111-111111111111'),
    ('c0000000-0000-4000-8000-000000000002', 'Medellín', '11111111-1111-4111-8111-111111111111'),
    ('c0000000-0000-4000-8000-000000000003', 'Ciudad de México', '22222222-2222-4222-8222-222222222222'),
    ('c0000000-0000-4000-8000-000000000004', 'Madrid', '33333333-3333-4333-8333-333333333333')
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- 12. BANKS
-- =========================================

INSERT INTO banks (id, name, country_id) VALUES
    ('b0000000-0000-4000-8000-000000000001', 'Bancolombia', '11111111-1111-4111-8111-111111111111'),
    ('b0000000-0000-4000-8000-000000000002', 'Davivienda', '11111111-1111-4111-8111-111111111111'),
    ('b0000000-0000-4000-8000-000000000003', 'BBVA México', '22222222-2222-4222-8222-222222222222'),
    ('b0000000-0000-4000-8000-000000000004', 'Santander', '33333333-3333-4333-8333-333333333333')
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- 13. OWNERS
-- =========================================

-- balance starts at 0 and is computed from the transactions (section 18)
INSERT INTO owners (id, name, phone, email, bank_id, account_number, account_type) VALUES
    ('a0000000-0000-4000-8000-000000000001', 'Ana Gómez', '3001234567', 'ana.gomez@example.com', 'b0000000-0000-4000-8000-000000000001', '5001001001', 'Ahorros'),
    ('a0000000-0000-4000-8000-000000000002', 'Carlos Pérez', '3109876543', 'carlos.perez@example.com', 'b0000000-0000-4000-8000-000000000002', '5002002002', 'Corriente'),
    ('a0000000-0000-4000-8000-000000000003', 'Laura Martínez', '5512345678', 'laura.martinez@example.com', 'b0000000-0000-4000-8000-000000000003', '5003003003', 'Ahorros'),
    ('a0000000-0000-4000-8000-000000000004', 'Javier López', '34600111222', 'javier.lopez@example.com', 'b0000000-0000-4000-8000-000000000004', '5004004004', 'Corriente')
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- 14. CLIENTS
-- =========================================

INSERT INTO clients (id, name, phone, email, city_id, bank_id, account_number, account_type) VALUES
    ('d0000000-0000-4000-8000-000000000001', 'Sofía Ramírez', '3201112233', 'sofia.ramirez@example.com', 'c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', '1002003001', 'Ahorros'),
    ('d0000000-0000-4000-8000-000000000002', 'Diego Torres', '3114445566', 'diego.torres@example.com', 'c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', '2003004002', 'Corriente'),
    ('d0000000-0000-4000-8000-000000000003', 'Valentina Ruiz', '5522334455', 'valentina.ruiz@example.com', 'c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000003', '3004005003', 'Ahorros'),
    ('d0000000-0000-4000-8000-000000000004', 'Andrés Herrera', '34611222333', 'andres.herrera@example.com', 'c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000004', '4005006004', 'Corriente')
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- 15. ADMINISTRATOR
-- =========================================

-- balance starts at 0 and is computed from the transactions (section 18)
INSERT INTO administrators (id, name, phone, email, bank_id, account_number, account_type) VALUES
    ('f0000000-0000-4000-8000-000000000001', 'Administrador Brisa', '3000000000', 'admin@brisa.example.com', 'b0000000-0000-4000-8000-000000000001', '9001001001', 'Corriente')
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- 16. PROPERTIES
-- =========================================

INSERT INTO properties (id, address, area, number_of_rooms, capacity, price_per_night, owner_id, city_id) VALUES
    ('e0000000-0000-4000-8000-000000000001', 'Calle 45 #12-30, Chapinero', 65.00, 2, 4, 180.00, 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001'),
    ('e0000000-0000-4000-8000-000000000002', 'Carrera 80 #34-12, Laureles', 180.50, 4, 8, 350.00, 'a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002'),
    ('e0000000-0000-4000-8000-000000000003', 'Calle Colima 210, Roma Norte', 45.00, 1, 2, 220.00, 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000003'),
    ('e0000000-0000-4000-8000-000000000004', 'Calle del Pez 18, Malasaña', 80.00, 3, 5, 300.00, 'a0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000004'),
    ('e0000000-0000-4000-8000-000000000005', 'Carrera 43A #7-50, El Poblado', 40.00, 1, 2, 160.00, 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- 17. RENTALS
-- =========================================

INSERT INTO rentals (property_id, client_id, check_in_date, check_out_date, charged_amount) VALUES
    ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', '2026-11-10', '2026-11-15', 900.00),
    ('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002', '2026-11-20', '2026-11-25', 1750.00),
    ('e0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000003', '2026-12-01', '2026-12-07', 1320.00),
    ('e0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000004', '2026-12-10', '2026-12-15', 1500.00),
    ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', '2026-12-20', '2026-12-27', 1260.00),
    ('e0000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000001', '2026-12-05', '2026-12-09', 640.00),
    ('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001', '2027-01-05', '2027-01-12', 2450.00)
ON CONFLICT (property_id, client_id, check_in_date) DO NOTHING;

UPDATE rentals SET status = CASE
    WHEN CURRENT_DATE < check_in_date THEN 'UPCOMING'
    WHEN CURRENT_DATE >= check_out_date THEN 'FINISHED'
    ELSE 'ACTIVE'
END;

-- =========================================
-- 18. TRANSACTIONS AND BALANCES
-- =========================================

-- One PAYMENT per seeded rental, as if it was booked 15 days before the
-- check-in (never in the future). Commission: 10% rounded to cents; net:
-- the rest, so commission + net is exactly the gross amount (same rule as
-- the domain).
INSERT INTO administrator_owner_transactions
    (id, administrator_id, owner_id, type, gross_amount, commission, net_amount, created_at)
SELECT
    gen_random_uuid()::text,
    'f0000000-0000-4000-8000-000000000001',
    p.owner_id,
    'PAYMENT',
    r.charged_amount,
    ROUND(r.charged_amount * 0.10, 2),
    r.charged_amount - ROUND(r.charged_amount * 0.10, 2),
    LEAST((r.check_in_date - INTERVAL '15 days')::timestamptz, NOW())
FROM rentals r
JOIN properties p ON p.id = r.property_id;

-- Each owner holds the net amount of its transactions
UPDATE owners o SET balance = COALESCE((
    SELECT SUM(CASE WHEN t.type = 'PAYMENT' THEN t.net_amount ELSE -t.net_amount END)
    FROM administrator_owner_transactions t
    WHERE t.owner_id = o.id
), 0);

-- The administrator holds the commissions
UPDATE administrators a SET balance = COALESCE((
    SELECT SUM(CASE WHEN t.type = 'PAYMENT' THEN t.commission ELSE -t.commission END)
    FROM administrator_owner_transactions t
    WHERE t.administrator_id = a.id
), 0);
