#!/usr/bin/env python3
"""Read-only Home Assistant Tuya -> Pest Control PREVIEW test relay.

No Tuya developer/API project. Home Assistant's Tuya integration must already
be authorised in its UI. This bridge ONLY forwards genuine mapped HA entity
states. It does NOT connect to the mobile app, control the mouse, change
firmware, touch manual SmartLife pages, or trigger customer alarms.

On a persistent, trusted Home Assistant host:
  HA_URL                      http://127.0.0.1:8123
  HA_LONG_LIVED_TOKEN         Home Assistant account token (private)
  PESTCONTROL_TEST_BASE_URL   exact authorised https://...vercel.app preview URL
  SMARTLIFE_APP_TEST_BRIDGE_TOKEN  exact server-side preview bridge secret
  HA_BATTERY_ENTITY           optional sensor.* entity id
  HA_CAUGHT_ENTITY            optional verified binary_sensor.* entity id
  HA_CONNECTION_ENTITY        optional explicit connection sensor (not assumed)
  HA_WIFI_SIGNAL_ENTITY       optional dBm signal sensor
  SMARTLIFE_TEST_DEVICE_KEY   stable label, defaults to mouse_11_addis_test
  SMARTLIFE_TEST_DEVICE_NAME  visible label, defaults to Mouse 11 - Addis Test

Do not paste credentials into GitHub, ChatGPT or screenshots.
"""
import json
import os
import sys
import time
from urllib.parse import urlparse
from urllib.request import Request, urlopen

INVALID = {"", "unknown", "unavailable", "none", "null"}
SOURCE = "home-assistant-tuya"


def valid_number(raw, lo, hi):
    if raw is None or isinstance(raw, bool):
        return None
    try:
        value = float(str(raw))
        if not (lo <= value <= hi and value.is_integer()):
            return None
        return int(value)
    except (ValueError, TypeError, OverflowError):
        return None


def optional_status(value):
    value = str(value).strip().lower()
    return value if value in ("connected", "disconnected", "unknown") else None


def caught_state(value):
    value = str(value).strip().lower()
    if value in ("on", "detected", "caught", "true", "1"):
        return True
    if value in ("off", "clear", "ready", "false", "0"):
        return False
    return None


def parse_entities(states, mapping):
    """Ignore absent/unknown Tuya entities; never create invented readings."""
    indexed = {str(s.get("entity_id")): s for s in states if isinstance(s, dict)}
    result = {}
    for envname, output, parser in (
        ("HA_BATTERY_ENTITY", "battery", lambda v: valid_number(v, 0, 100)),
        ("HA_WIFI_SIGNAL_ENTITY", "wifiSignalDbm", lambda v: valid_number(v, -120, 0)),
        ("HA_CONNECTION_ENTITY", "connection", optional_status),
        ("HA_CAUGHT_ENTITY", "caught", caught_state),
    ):
        eid = mapping.get(envname, "").strip()
        if not eid or eid not in indexed:
            continue
        raw = str(indexed[eid].get("state", "")).strip()
        if raw.lower() in INVALID:
            continue
        parsed = parser(raw)
        if parsed is not None:
            result[output] = parsed
    return result


def fetch_json(url, token):
    request = Request(url, headers={
        "Authorization": "Bearer " + token,
        "Accept": "application/json",
    })
    with urlopen(request, timeout=15) as response:
        return json.load(response)


def post_json(url, token, payload):
    body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    request = Request(url, data=body, method="POST", headers={
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
        "Accept": "application/json",
    })
    with urlopen(request, timeout=15) as response:
        return json.load(response)


def main():
    if "--self-test" in sys.argv:
        test = [{"entity_id": "sensor.mouse_11_battery", "state": "50"},
                {"entity_id": "binary_sensor.mouse_11_caught", "state": "off"},
                {"entity_id": "sensor.missing", "state": "unavailable"}]
        report = parse_entities(test, {
            "HA_BATTERY_ENTITY": "sensor.mouse_11_battery",
            "HA_CAUGHT_ENTITY": "binary_sensor.mouse_11_caught",
            "HA_WIFI_SIGNAL_ENTITY": "sensor.missing",
        })
        assert report == {"battery": 50, "caught": False}, report
        assert caught_state("unavailable") is None
        assert valid_number("200", 0, 100) is None
        print("PASS: real-only Home Assistant entity mapping; nothing sent")
        return

    ha_url = os.getenv("HA_URL", "").rstrip("/")
    preview = os.getenv("PESTCONTROL_TEST_BASE_URL", "").rstrip("/")
    ha_token = os.getenv("HA_LONG_LIVED_TOKEN", "").strip()
    bridge_token = os.getenv("SMARTLIFE_APP_TEST_BRIDGE_TOKEN", "").strip()
    mapping = {key: os.getenv(key, "") for key in (
        "HA_BATTERY_ENTITY", "HA_WIFI_SIGNAL_ENTITY",
        "HA_CONNECTION_ENTITY", "HA_CAUGHT_ENTITY")}
    device_key = os.getenv("SMARTLIFE_TEST_DEVICE_KEY", "mouse_11_addis_test").strip()
    device_name = os.getenv("SMARTLIFE_TEST_DEVICE_NAME", "Mouse 11 - Addis Test").strip()
    host = urlparse(preview)
    home = urlparse(ha_url)
    if (not ha_token or len(bridge_token) < 32 or
        host.scheme != "https" or not host.hostname or
        not host.hostname.endswith(".vercel.app") or
        host.path not in ("", "/") or
        home.scheme not in ("http", "https") or not home.hostname or
        not any(v.strip() for v in mapping.values()) or
        not device_key.replace("_", "").replace("-", "").isalnum()):
        sys.exit("Not configured: authorised HA URL/token, exact PREVIEW, "
                 "bridge secret and at least one verified HA entity are required.")

    endpoint = preview + "/api/integrations/smartlife-app-test/report"
    last_sent = None
    print("SmartLife App Test: watching mapped HA entities; no synthetic readings.")
    while True:
        try:
            states = fetch_json(ha_url + "/api/states", ha_token)
            if not isinstance(states, list):
                raise ValueError("Invalid Home Assistant states response")
            readings = parse_entities(states, mapping)
            signature = json.dumps(readings, sort_keys=True)
            if readings and signature != last_sent:
                report = {"source": SOURCE, "deviceKey": device_key,
                          "deviceName": device_name, **readings}
                answer = post_json(endpoint, bridge_token, report)
                if not answer.get("saved"):
                    raise RuntimeError("Test receiver refused the reading")
                last_sent = signature
                print("Sent changed HA entity values only; keys:", ", ".join(readings))
            elif not readings:
                print("No mapped values exposed; no report sent.")
        except Exception as err:
            # Never print URL tokens or entire private API responses.
            print("Bridge check failed:", type(err).__name__)
        if "--once" in sys.argv:
            return
        time.sleep(30)


if __name__ == "__main__":
    main()
