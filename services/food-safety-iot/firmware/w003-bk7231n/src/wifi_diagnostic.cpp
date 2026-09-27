#if __has_include("local_config.h")
#include "local_config.h"
#endif

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
#ifndef DEVICE_ID
#define DEVICE_ID "FS-MOUSE-000001"
#endif

WiFiClient net;
PubSubClient mqtt(net);

static constexpr uint32_t WIFI_RETRY_MS = 30000;
static constexpr uint32_t MQTT_RETRY_MS = 10000;
static constexpr uint32_t BEACON_REFRESH_MS = 2000;

unsigned long lastWifiAttempt = 0;
unsigned long lastMqttAttempt = 0;
unsigned long lastBeaconRefresh = 0;
String currentBeacon;

const char* wifiCode(int status) {
  switch (status) {
    case WL_IDLE_STATUS: return "IDLE";
    case WL_NO_SSID_AVAIL: return "NO-SSID";
    case WL_SCAN_COMPLETED: return "SCAN-DONE";
    case WL_CONNECTED: return "WIFI-OK";
    case WL_CONNECT_FAILED: return "AUTH-FAIL";
    case WL_CONNECTION_LOST: return "LOST";
    case WL_DISCONNECTED: return "DISCONNECTED";
    default: return "UNKNOWN";
  }
}

String mqttCode(int state) {
  if (state == 0) return "OK";
  if (state < 0) return String("N") + String(-state);
  return String("P") + String(state);
}

String desiredBeaconName() {
  const int wifiStatus = WiFi.status();
  if (wifiStatus != WL_CONNECTED) {
    return String("FS-DIAG-") + wifiCode(wifiStatus);
  }
  if (mqtt.connected()) return "FS-DIAG-OK";
  return String("FS-DIAG-MQTT-") + mqttCode(mqtt.state());
}

void setDiagnosticBeacon(const String& ssid) {
  if (ssid == currentBeacon) return;

  if (currentBeacon.length()) {
    WiFi.softAPdisconnect(true);
    delay(100);
  }

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(ssid.c_str());
  currentBeacon = ssid;
}

void ensureWifi() {
  if (WiFi.status() == WL_CONNECTED) return;
  if (lastWifiAttempt && millis() - lastWifiAttempt < WIFI_RETRY_MS) return;

  lastWifiAttempt = millis();
  WiFi.mode(WIFI_AP_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void ensureMqtt() {
  if (WiFi.status() != WL_CONNECTED || mqtt.connected()) return;
  if (lastMqttAttempt && millis() - lastMqttAttempt < MQTT_RETRY_MS) return;

  lastMqttAttempt = millis();
  String clientId = String("foodsafety-diag-") + DEVICE_ID;
  mqtt.connect(clientId.c_str());
}

void setup() {
  // Do not use Serial here: W003 shares this UART with its trap MCU.
  // Diagnostic state is exposed as a temporary Wi-Fi AP SSID instead.
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  WiFi.mode(WIFI_AP_STA);
  setDiagnosticBeacon("FS-DIAG-BOOT");
  ensureWifi();
}

void loop() {
  ensureWifi();
  ensureMqtt();

  if (mqtt.connected()) mqtt.loop();

  if (!lastBeaconRefresh || millis() - lastBeaconRefresh >= BEACON_REFRESH_MS) {
    lastBeaconRefresh = millis();
    setDiagnosticBeacon(desiredBeaconName());
  }

  delay(20);
}
