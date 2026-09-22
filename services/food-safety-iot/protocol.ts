export const FOOD_SAFETY_IOT_PROTOCOL_VERSION = 1 as const;

export type DeviceLifecycleState =
  | "pre_registered"
  | "awaiting_activation"
  | "online"
  | "offline"
  | "revoked";

export type DeviceEventType =
  | "trap_triggered"
  | "trap_reset"
  | "tamper"
  | "low_battery"
  | "boot"
  | "reconnected";

export interface DeviceIdentity {
  deviceId: string;
  hardwareModel: string;
  firmwareVersion: string;
  protocolVersion: typeof FOOD_SAFETY_IOT_PROTOCOL_VERSION;
}

export interface DeviceStatusMessage extends DeviceIdentity {
  online: boolean;
  batteryPct?: number;
  rssi?: number;
  uptimeSec?: number;
  timestamp: string;
}

export interface DeviceEventMessage extends DeviceIdentity {
  eventId: string;
  type: DeviceEventType;
  value: boolean | number | string;
  timestamp: string;
}

export interface DeviceTelemetryMessage extends DeviceIdentity {
  batteryPct?: number;
  batteryMv?: number;
  rssi?: number;
  temperatureC?: number;
  timestamp: string;
}

export interface DeviceCommandMessage {
  commandId: string;
  type: "ping" | "request_status" | "restart" | "ota_check";
  issuedAt: string;
}

export interface DeviceAckMessage {
  commandId: string;
  ok: boolean;
  message?: string;
  timestamp: string;
}

export const topicFor = {
  status(deviceId: string) {
    return `fs/v1/device/${deviceId}/status`;
  },
  event(deviceId: string) {
    return `fs/v1/device/${deviceId}/event`;
  },
  telemetry(deviceId: string) {
    return `fs/v1/device/${deviceId}/telemetry`;
  },
  command(deviceId: string) {
    return `fs/v1/device/${deviceId}/command`;
  },
  ack(deviceId: string) {
    return `fs/v1/device/${deviceId}/ack`;
  },
} as const;

export function isValidFoodSafetyDeviceId(value: string): boolean {
  return /^FS-[A-Z0-9]+-[0-9]{6,}$/.test(value);
}

export function assertTimestamp(value: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error("Invalid ISO timestamp");
  }
}

export function validateStatusMessage(message: DeviceStatusMessage): void {
  if (!isValidFoodSafetyDeviceId(message.deviceId)) {
    throw new Error("Invalid device id");
  }
  if (message.protocolVersion !== FOOD_SAFETY_IOT_PROTOCOL_VERSION) {
    throw new Error("Unsupported protocol version");
  }
  if (message.batteryPct !== undefined && (message.batteryPct < 0 || message.batteryPct > 100)) {
    throw new Error("Battery percentage out of range");
  }
  assertTimestamp(message.timestamp);
}

export function validateEventMessage(message: DeviceEventMessage): void {
  if (!isValidFoodSafetyDeviceId(message.deviceId)) {
    throw new Error("Invalid device id");
  }
  if (message.protocolVersion !== FOOD_SAFETY_IOT_PROTOCOL_VERSION) {
    throw new Error("Unsupported protocol version");
  }
  if (!message.eventId || message.eventId.length > 128) {
    throw new Error("Invalid event id");
  }
  assertTimestamp(message.timestamp);
}
