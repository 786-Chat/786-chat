// Verify that the Food Safety backend has identified and assigned a mouse.
// No local environment variable or SmartLife access-point sighting constitutes
// authentication or proof of a physical MQTT connection.
export function registeredDeviceIdFromResponse(data) {
  const id = typeof data?.deviceId === 'string' ? data.deviceId.trim() : '';
  return /^FS-MOUSE-[0-9]{6}$/.test(id) ? id : '';
}
