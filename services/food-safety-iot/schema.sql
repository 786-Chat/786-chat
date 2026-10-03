CREATE TABLE IF NOT EXISTS owned_iot_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL UNIQUE,
  hardware_model text NOT NULL,
  firmware_version text,
  customer_id uuid,
  branch_id uuid,
  friendly_name text,
  installation_location text,
  lifecycle_state text NOT NULL DEFAULT 'pre_registered',
  is_online boolean NOT NULL DEFAULT false,
  battery_pct integer,
  rssi integer,
  last_seen_at timestamptz,
  last_alarm_at timestamptz,
  last_event_id text,
  credential_fingerprint text,
  activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT owned_iot_devices_battery_pct_check CHECK (battery_pct IS NULL OR battery_pct BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS owned_iot_devices_branch_idx ON owned_iot_devices(branch_id);
CREATE INDEX IF NOT EXISTS owned_iot_devices_customer_idx ON owned_iot_devices(customer_id);
CREATE INDEX IF NOT EXISTS owned_iot_devices_last_seen_idx ON owned_iot_devices(last_seen_at DESC);

CREATE TABLE IF NOT EXISTS owned_iot_events (
  id bigserial PRIMARY KEY,
  event_id text NOT NULL UNIQUE,
  device_id text NOT NULL REFERENCES owned_iot_devices(device_id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_value jsonb,
  event_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  raw_payload jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS owned_iot_events_device_time_idx ON owned_iot_events(device_id, event_at DESC);
CREATE INDEX IF NOT EXISTS owned_iot_events_type_time_idx ON owned_iot_events(event_type, event_at DESC);
