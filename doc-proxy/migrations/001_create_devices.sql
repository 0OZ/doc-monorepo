-- Create devices table for device-based authentication
-- Run this migration manually or via a migration tool

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mac_address VARCHAR(17) UNIQUE NOT NULL,
    api_key_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    user_id UUID,
    role VARCHAR(50) NOT NULL DEFAULT 'client',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for API key lookups (though we hash-compare all active devices)
CREATE INDEX IF NOT EXISTS idx_devices_is_active ON devices(is_active);

-- Index for MAC address lookups
CREATE INDEX IF NOT EXISTS idx_devices_mac ON devices(mac_address);

-- Comment on table
COMMENT ON TABLE devices IS 'Registered devices for API key authentication';
COMMENT ON COLUMN devices.mac_address IS 'Device MAC address in format AA:BB:CC:DD:EE:FF';
COMMENT ON COLUMN devices.api_key_hash IS 'Argon2 hash of the API key';
COMMENT ON COLUMN devices.role IS 'Device role: admin, staff, or client';
COMMENT ON COLUMN devices.is_active IS 'Whether the device can authenticate';
COMMENT ON COLUMN devices.last_seen IS 'Last successful authentication timestamp';
