# Smart Life app → Pest Control Admin (isolated TEST ONLY)

**Status: adapter prepared, NOT connected.** This does not alter Admin
SmartLife Check, SmartLife Devices, HP2 MQTT, customer data or pestcontrol.cat.

## Confirmed user test
Mouse #11 (Addis Test) paired in Smart Life, the app showed battery 50%,
and offers "Mouse was killed" / low-voltage notification settings.
Its local network diagnostic reported "Searched device is not nearby";
the app notes low-power devices may not support local network detection.
This is **not evidence** that Tuya exposes battery/catch values to third parties.

## Required independent installation
1. Run Home Assistant on a **persistent, secured host**. An HP2 Ubuntu Live
   session is unsuitable for a permanent system, and Vercel does not run
   Home Assistant's persistent application. Home Assistant may be installed
   on an always-on local computer (for a temporary test) or a separately
   managed server (for operation with HP2 OFF).
2. Use Settings > Devices & services > Add integration > **Tuya**. In Smart
   Life: Me > Settings > Account and Security > User Code. Complete the
   Home Assistant QR-code authorization with the Smart Life mobile app.
   Official instructions: https://www.home-assistant.io/integrations/tuya/
3. Inspect Mouse #11 in Home Assistant. Note which **actual entity IDs**
   exist. Download device diagnostics if needed and inspect `status`,
   `status_range` and `function` to establish availability.
4. **Stop if the needed entities are unavailable.** The presence of a
   "Mouse was killed" notification switch in Smart Life does not establish
   that Home Assistant exposes a catch event. Do not invent a binary sensor.
5. Configure a long random token as preview-branch-only Vercel variable
   `SMARTLIFE_APP_TEST_BRIDGE_TOKEN`, and provide the matching token
   privately to the Home Assistant bridge runtime. Never put it in git,
   screenshots or chat logs. Do not configure on production.
6. Run the adjacent `home-assistant-bridge.py` on the trusted persistent host.
   It reads only the explicitly mapped Home Assistant entities, sends only
   changed readings, and does **not** operate the trap or send customer alarms.
7. Sign in to the preview **Admin > SmartLife App Test Check** and press
   **Check connection**. Confirm *actual* battery/connection/catch readings
   under **SmartLife App Devices**. No sample or placeholder readings.

## Bridge environment settings (names only; no real credentials)

```sh
HA_URL=http://127.0.0.1:8123
HA_LONG_LIVED_TOKEN=<private-home-assistant-long-lived-access-token>
PESTCONTROL_TEST_BASE_URL=https://<existing-preview-host>.vercel.app
SMARTLIFE_APP_TEST_BRIDGE_TOKEN=<matching-private-preview-test-bridge-token>
SMARTLIFE_TEST_DEVICE_KEY=mouse_11_addis_test
SMARTLIFE_TEST_DEVICE_NAME="Mouse 11 - Addis Test"
HA_BATTERY_ENTITY=<verified-entity-id-from-home-assistant>
HA_CAUGHT_ENTITY=<verified-entity-id-only-if-actually-exposed>
HA_WIFI_SIGNAL_ENTITY=<verified-entity-id-only-if-exposed>
HA_CONNECTION_ENTITY=<verified-entity-id-only-if-exposed>
```

**Never replace missing data with fake values.** If only battery exists,
leave catch/signal/connection mappings unset. The bridge will send only
what is available.

The script can run `python3 home-assistant-bridge.py --self-test` without
credentials or any network calls. The self-test is parser-only, *not* a
simulated report to Pest Control.

## Limits
- No Tuya IoT Developer project is required for the standard Home Assistant
  Tuya integration, but Tuya's cloud is still involved.
- Home Assistant cannot access all Smart Life device functions.
- "Connected" in a diagnostic is not necessarily continuous live reporting;
  this bridge only reports source values when they change.
- Battery, catch status and device event freshness must be verified.
- Customer branch assignment and automated restaurant alarms are
  intentionally **disabled in TEST** until explicit approval after testing.
- If unsupported, remove the test-only pages, receiver and isolated table;
  leave the working manual SmartLife modules unchanged.
