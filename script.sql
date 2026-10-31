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
    bank_id VARCHAR(36) NOT NULL,

    FOREIGN KEY (bank_id) REFERENCES banks(id)
);

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

    -- Bank account linked to the client
    bank_id VARCHAR(36) NOT NULL,
    account_number VARCHAR(30) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    balance DECIMAL(12,2) NOT NULL DEFAULT 0,

    FOREIGN KEY (city_id) REFERENCES cities(id),
    FOREIGN KEY (bank_id) REFERENCES banks(id),

    CONSTRAINT CHK_clients_balance CHECK (balance >= 0)
);

-- =========================================
-- 6. PROPERTIES
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

    FOREIGN KEY (owner_id) REFERENCES owners(id),
    FOREIGN KEY (city_id) REFERENCES cities(id)
);

-- =========================================
-- 7. RENTALS
-- =========================================

CREATE TABLE rentals (
    property_id VARCHAR(36) NOT NULL,
    client_id VARCHAR(36) NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,

    PRIMARY KEY (property_id, client_id, check_in_date),

    FOREIGN KEY (property_id) REFERENCES properties(id),
    FOREIGN KEY (client_id) REFERENCES clients(id),

    CONSTRAINT CHK_rentals_dates CHECK (check_out_date > check_in_date)
);
