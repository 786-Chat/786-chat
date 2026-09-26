#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>

#ifndef WIFI_SSID
#define WIFI_SSID ""
#endif
#ifndef WIFI_PASSWORD
#define WIFI_PASSWORD ""
#endif
#ifndef MQTT_HOST
#define MQTT_HOST ""
#endif
#ifndef MQTT_PORT
#define MQTT_PORT 1883
#endif
#ifndef MQTT_USERNAME
#define MQTT_USERNAME ""
#endif
#ifndef MQTT_PASSWORD
#define MQTT_PASSWORD ""
#endif
#ifndef DEVICE_ID
#define DEVICE_ID "FS-MOUSE-000001"
#endif

static constexpr uint32_t MCU_BAUD = 9600;
static constexpr uint32_t STATUS_INTERVAL_MS = 15000;
static constexpr uint32_t WIFI_RETRY_MS = 5000;
static constexpr uint32_t MQTT_RETRY_MS = 3000;
static constexpr uint8_t TUYA_HEADER_0 = 0x55;
static constexpr uint8_t TUYA_HEADER_1 = 0xAA;

WiFiClient net;
PubSubClient mqtt(net);

struct DpState {
  bool seen = false;
  uint32_t value = 0;
};

DpState dp101;
DpState dp102;
DpState dp103;
bool trapBaselineKnown = false;
bool trapActive = false;
unsigned long lastStatusAt = 0;
unsigned long lastWifiAttempt = 0;
unsigned long lastMqttAttempt = 0;
uint32_t eventCounter = 0;

uint8_t frame[300];
size_t frameLen = 0;
size_t expectedLen = 0;

String baseTopic() {
  return String("fs/v1/device/") + DEVICE_ID;
}

void mqttPublish(const String& suffix, const String& payload, bool retained = false) {
  if (!mqtt.connected()) return;
  mqtt.publish((baseTopic() + "/" + suffix).c_str(), payload.c_str(), retained);
}

void publishStatus(bool online = true) {
  const long rssi = WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : 0;
  uint32_t batteryPct = 0;
  bool hasBattery = false;
  if (dp102.seen) {
    hasBattery = true;
    switch (dp102.value) {
      case 0: batteryPct = 100; break;
      case 1: batteryPct = 75; break;
      case 2: batteryPct = 50; break;
      case 3: batteryPct = 25; break;
      default: batteryPct = dp102.value > 100 ? 0 : dp102.value; break;
    }
  }

  String s = "{";
  s += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  s += "\"hardwareModel\":\"BMAX-W003-BK7231N\",";
  s += "\"firmwareVersion\":\"foodsafety-1.0.0\",";
  s += "\"protocolVersion\":1,";
  s += "\"online\":" + String(online ? "true" : "false") + ",";
  if (hasBattery) s += "\"batteryPct\":" + String(batteryPct) + ",";
  s += "\"rssi\":" + String(rssi) + ",";
  s += "\"uptimeSec\":" + String(millis() / 1000UL) + ",";
  s += "\"timestamp\":\"" + String(millis()) + "\"";
  s += "}";
  mqttPublish("status", s, true);
}

String nextEventId() {
  eventCounter++;
  return String(DEVICE_ID) + "-" + String(millis()) + "-" + String(eventCounter);
}

void publishEvent(const char* type, bool value) {
  String s = "{";
  s += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  s += "\"hardwareModel\":\"BMAX-W003-BK7231N\",";
  s += "\"firmwareVersion\":\"foodsafety-1.0.0\",";
  s += "\"protocolVersion\":1,";
  s += "\"eventId\":\"" + nextEventId() + "\",";
  s += "\"type\":\"" + String(type) + "\",";
  s += "\"value\":" + String(value ? "true" : "false") + ",";
  s += "\"timestamp\":\"" + String(millis()) + "\"";
  s += "}";
  mqttPublish("event", s, false);
}

void publishDp(uint8_t dpid, uint8_t type, uint32_t value) {
  String s = "{";
  s += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  s += "\"dpid\":" + String(dpid) + ",";
  s += "\"dpType\":" + String(type) + ",";
  s += "\"value\":" + String(value) + ",";
  s += "\"uptimeMs\":" + String(millis());
  s += "}";
  mqttPublish("telemetry", s, false);
}

bool isTrapDp(uint8_t dpid) {
  return dpid == 101 || dpid == 103;
}

void updateTrapState() {
  bool haveAny = false;
  bool active = false;
  if (dp101.seen) {
    haveAny = true;
    active = active || dp101.value != 0;
  }
  if (dp103.seen) {
    haveAny = true;
    active = active || dp103.value != 0;
  }
  if (!haveAny) return;

  if (!trapBaselineKnown) {
    trapBaselineKnown = true;
    trapActive = active;
    return;
  }

  if (active == trapActive) return;
  trapActive = active;
  publishEvent(active ? "trap_triggered" : "trap_reset", active);
}

uint32_t decodeDpValue(uint8_t type, const uint8_t* data, uint16_t len) {
  if (len == 0) return 0;
  if (type == 0x01 || type == 0x04) return data[0];
  if (type == 0x02 && len >= 4) {
    return (uint32_t(data[0]) << 24) |
           (uint32_t(data[1]) << 16) |
           (uint32_t(data[2]) << 8) |
           uint32_t(data[3]);
  }
  uint32_t v = 0;
  for (uint16_t i = 0; i < len && i < 4; i++) v = (v << 8) | data[i];
  return v;
}

void handleDpReport(const uint8_t* data, uint16_t len) {
  uint16_t i = 0;
  while (i + 4 <= len) {
    const uint8_t dpid = data[i++];
    const uint8_t type = data[i++];
    const uint16_t dlen = (uint16_t(data[i]) << 8) | data[i + 1];
    i += 2;
    if (i + dlen > len) break;

    const uint32_t value = decodeDpValue(type, &data[i], dlen);
    publishDp(dpid, type, value);

    if (dpid == 101) {
      dp101.seen = true;
      dp101.value = value;
    } else if (dpid == 102) {
      dp102.seen = true;
      dp102.value = value;
      publishStatus(true);
    } else if (dpid == 103) {
      dp103.seen = true;
      dp103.value = value;
    }

    if (isTrapDp(dpid)) updateTrapState();
    i += dlen;
  }
}

void sendTuyaFrame(uint8_t version, uint8_t cmd, const uint8_t* data, uint16_t len) {
  uint8_t sum = TUYA_HEADER_0 + TUYA_HEADER_1 + version + cmd + uint8_t(len >> 8) + uint8_t(len);
  Serial.write(TUYA_HEADER_0);
  Serial.write(TUYA_HEADER_1);
  Serial.write(version);
  Serial.write(cmd);
  Serial.write(uint8_t(len >> 8));
  Serial.write(uint8_t(len));
  for (uint16_t i = 0; i < len; i++) {
    Serial.write(data[i]);
    sum += data[i];
  }
  Serial.write(sum);
  Serial.flush();
}

void handleTuyaFrame(const uint8_t* f, size_t n) {
  if (n < 7 || f[0] != TUYA_HEADER_0 || f[1] != TUYA_HEADER_1) return;
  const uint8_t version = f[2];
  const uint8_t cmd = f[3];
  const uint16_t len = (uint16_t(f[4]) << 8) | f[5];
  if (size_t(len) + 7 != n) return;

  uint8_t checksum = 0;
  for (size_t i = 0; i < n - 1; i++) checksum += f[i];
  if (checksum != f[n - 1]) return;

  const uint8_t* data = &f[6];

  switch (cmd) {
    case 0x00: {
      const uint8_t response = 0x00;
      sendTuyaFrame(version, cmd, &response, 1);
      break;
    }
    case 0x01:
    case 0x02:
    case 0x08:
      sendTuyaFrame(version, cmd, nullptr, 0);
      break;
    case 0x07:
      handleDpReport(data, len);
      break;
    default:
      break;
  }
}

void readTuyaUart() {
  while (Serial.available()) {
    const uint8_t b = uint8_t(Serial.read());

    if (frameLen == 0 && b != TUYA_HEADER_0) continue;
    if (frameLen == 1 && b != TUYA_HEADER_1) {
      frameLen = (b == TUYA_HEADER_0) ? 1 : 0;
      if (frameLen == 1) frame[0] = TUYA_HEADER_0;
      continue;
    }

    if (frameLen < sizeof(frame)) frame[frameLen++] = b;
    else {
      frameLen = 0;
      expectedLen = 0;
      continue;
    }

    if (frameLen == 6) {
      const uint16_t payloadLen = (uint16_t(frame[4]) << 8) | frame[5];
      expectedLen = size_t(payloadLen) + 7;
      if (expectedLen > sizeof(frame)) {
        frameLen = 0;
        expectedLen = 0;
      }
    }

    if (expectedLen && frameLen == expectedLen) {
      handleTuyaFrame(frame, frameLen);
      frameLen = 0;
      expectedLen = 0;
    }
  }
}

void ensureWifi() {
  if (WiFi.status() == WL_CONNECTED) return;
  if (millis() - lastWifiAttempt < WIFI_RETRY_MS) return;
  lastWifiAttempt = millis();
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void ensureMqtt() {
  if (WiFi.status() != WL_CONNECTED || mqtt.connected()) return;
  if (millis() - lastMqttAttempt < MQTT_RETRY_MS) return;
  lastMqttAttempt = millis();

  String clientId = String("foodsafety-") + DEVICE_ID;
  bool ok;
  if (strlen(MQTT_USERNAME)) {
    ok = mqtt.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD,
                      (baseTopic() + "/status").c_str(), 1, true,
                      "{\"online\":false}");
  } else {
    ok = mqtt.connect(clientId.c_str(), nullptr, nullptr,
                      (baseTopic() + "/status").c_str(), 1, true,
                      "{\"online\":false}");
  }

  if (ok) {
    publishStatus(true);
    publishEvent("boot", true);
  }
}

void setup() {
  Serial.begin(MCU_BAUD);
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setBufferSize(768);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  lastWifiAttempt = millis();
}

void loop() {
  readTuyaUart();
  ensureWifi();
  ensureMqtt();

  if (mqtt.connected()) mqtt.loop();

  if (mqtt.connected() && millis() - lastStatusAt >= STATUS_INTERVAL_MS) {
    lastStatusAt = millis();
    publishStatus(true);
  }

  delay(2);
}
