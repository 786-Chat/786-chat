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
static constexpr uint32_t WIFI_RETRY_MS=30000, MQTT_RETRY_MS=10000, REPORT_MS=5000;
unsigned long lastWifi=0,lastMqtt=0,lastReport=0;
int previousStatus=-1;
const char* statusName(int s){
 switch(s){
  case WL_IDLE_STATUS:return "IDLE";
  case WL_NO_SSID_AVAIL:return "NO_SSID";
  case WL_SCAN_COMPLETED:return "SCAN_COMPLETED";
  case WL_CONNECTED:return "CONNECTED";
  case WL_CONNECT_FAILED:return "CONNECT_FAILED";
  case WL_CONNECTION_LOST:return "CONNECTION_LOST";
  case WL_DISCONNECTED:return "DISCONNECTED";
  default:return "UNKNOWN";
 }
}
void report(){
 int s=WiFi.status();
 Serial.print("[wifi] status=");Serial.print(statusName(s));Serial.print(" code=");Serial.println(s);
 if(s==WL_CONNECTED){
  Serial.print("[wifi] ssid=");Serial.println(WiFi.SSID());
  Serial.print("[wifi] rssi=");Serial.print(WiFi.RSSI());Serial.println(" dBm");
  Serial.print("[wifi] ip=");Serial.println(WiFi.localIP());
  Serial.print("[wifi] gateway=");Serial.println(WiFi.gatewayIP());
  Serial.print("[wifi] dns=");Serial.println(WiFi.dnsIP());
 }
 Serial.print("[mqtt] connected=");Serial.print(mqtt.connected()?"yes":"no");
 Serial.print(" state=");Serial.println(mqtt.state());
}
void wifiConnect(){
 if(WiFi.status()==WL_CONNECTED)return;
 if(lastWifi && millis()-lastWifi<WIFI_RETRY_MS)return;
 lastWifi=millis();
 Serial.print("[wifi] begin ssid=");Serial.println(WIFI_SSID);
 Serial.println("[wifi] credential=<redacted>");
 WiFi.mode(WIFI_STA);WiFi.begin(WIFI_SSID,WIFI_PASSWORD);
}
void mqttConnect(){
 if(WiFi.status()!=WL_CONNECTED||mqtt.connected())return;
 if(lastMqtt && millis()-lastMqtt<MQTT_RETRY_MS)return;
 lastMqtt=millis();
 Serial.print("[mqtt] connect host=");Serial.print(MQTT_HOST);Serial.print(" port=");Serial.println(MQTT_PORT);
 String clientId=String("foodsafety-diag-")+DEVICE_ID;
 bool ok=mqtt.connect(clientId.c_str());
 Serial.print("[mqtt] result=");Serial.print(ok?"connected":"failed");Serial.print(" state=");Serial.println(mqtt.state());
}
void setup(){
 Serial.begin(115200);delay(500);
 Serial.println("\nFood Safety W003 Wi-Fi diagnostic");
 Serial.println("Credentials are never printed.");
 mqtt.setServer(MQTT_HOST,MQTT_PORT);wifiConnect();
}
void loop(){
 int s=WiFi.status();
 if(s!=previousStatus){previousStatus=s;report();}
 wifiConnect();mqttConnect();
 if(mqtt.connected())mqtt.loop();
 if(millis()-lastReport>=REPORT_MS){lastReport=millis();report();}
 delay(20);
}
