-- ===================================================================
-- ApexServices Database Migration V8
-- Dynamic Site Settings Persistence (Brand Name, Colors, Hero, Announcement)
-- Table: site_settings
-- ===================================================================

CREATE TABLE IF NOT EXISTS site_settings (
    setting_key VARCHAR(100) NOT NULL,
    setting_value LONGTEXT NULL,
    PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
