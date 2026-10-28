-- V1__create_users_table.sql
-- Final Schema for Users Table with Constraints & Defaults

CREATE TABLE users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NULL,
    mobile_number VARCHAR(20) NULL,
    password VARCHAR(255) NULL,

    provider ENUM('LOCAL', 'GOOGLE') NOT NULL,
    provider_id VARCHAR(255) NULL,

    role ENUM(
        'ROLE_ADMIN',
        'ROLE_CUSTOMER',
        'ROLE_PARTNER'
    ) NOT NULL DEFAULT 'ROLE_CUSTOMER',

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6),

    updated_at DATETIME(6) NOT NULL
        DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email),
    UNIQUE KEY uk_users_mobile (mobile_number),
    UNIQUE KEY uk_users_provider_id (provider, provider_id),

    CONSTRAINT chk_users_contact
        CHECK (email IS NOT NULL OR mobile_number IS NOT NULL),

    CONSTRAINT chk_users_auth
        CHECK (
            (provider = 'LOCAL' AND password IS NOT NULL)
            OR
            (provider = 'GOOGLE' AND provider_id IS NOT NULL)
        )
);
