-- V2__create_categories_and_icons_tables.sql
-- Create icons and categories tables with relational foreign key

CREATE TABLE IF NOT EXISTS icons (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    icon_type VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    icon_value LONGTEXT NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS categories (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    tag VARCHAR(50) NULL DEFAULT 'Popular',
    icon_id BIGINT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_categories_icon FOREIGN KEY (icon_id) REFERENCES icons(id) ON DELETE SET NULL
);

-- Seed System Icons
INSERT INTO icons (id, name, icon_type, icon_value) VALUES
(1, 'Hammer (Carpentry)', 'SYSTEM', 'Hammer'),
(2, 'Wrench (Plumbing)', 'SYSTEM', 'Wrench'),
(3, 'Zap (Electrical)', 'SYSTEM', 'Zap'),
(4, 'Paintbrush (Painting & Decor)', 'SYSTEM', 'Paintbrush'),
(5, 'Fan (HVAC & AC Service)', 'SYSTEM', 'Fan'),
(6, 'Tv (Appliance Care)', 'SYSTEM', 'Tv'),
(7, 'Sparkles (Deep Cleaning)', 'SYSTEM', 'Sparkles'),
(8, 'ShieldCheck (Security & Inspection)', 'SYSTEM', 'ShieldCheck'),
(9, 'Droplets (Water Purification)', 'SYSTEM', 'Droplets'),
(10, 'Flame (Gas & Water Heater)', 'SYSTEM', 'Flame'),
(11, 'Lock (Locksmith & Security)', 'SYSTEM', 'Lock'),
(12, 'Truck (Moving & Relocation)', 'SYSTEM', 'Truck'),
(13, 'Scissors (Gardening & Lawn)', 'SYSTEM', 'Scissors'),
(14, 'Wind (Ventilation & Duct Cleaning)', 'SYSTEM', 'Wind'),
(15, 'Camera (CCTV & Smart Security)', 'SYSTEM', 'Camera'),
(16, 'Layers (Flooring & Tiling)', 'SYSTEM', 'Layers'),
(17, 'Cpu (Smart Home Automation)', 'SYSTEM', 'Cpu'),
(18, 'Bug (Pest Control & Fumigation)', 'SYSTEM', 'Bug'),
(19, 'Home (Home Renovation)', 'SYSTEM', 'Home'),
(20, 'Package (Furniture Assembly)', 'SYSTEM', 'Package')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Seed Categories with Icon Relationship
INSERT INTO categories (id, name, description, tag, icon_id) VALUES
(1, 'Custom Carpentry', 'Custom cabinets, door installation, furniture repair, and precision wood craftsmanship.', 'Popular', 1),
(2, 'Emergency Plumbing', 'Pipe leak fixes, drain cleaning, tap replacement, and complete bathroom fitting.', '24/7 Service', 2),
(3, 'Electrical Maintenance', 'Short circuit repair, wiring, light installations, and circuit breaker upgrades.', 'Certified', 3),
(4, 'Painting & Decor', 'Interior wall painting, texture finish, weatherproof exterior coatings.', 'Premium', 4),
(5, 'HVAC & AC Service', 'AC installation, chemical cleaning, gas refill, and heating system tune-ups.', 'Cooling Specialist', 5),
(6, 'Appliance Care', 'Washing machine, refrigerator, oven, and microwave diagnostics and repair.', 'Fast Turnaround', 6)
ON DUPLICATE KEY UPDATE name=VALUES(name);
