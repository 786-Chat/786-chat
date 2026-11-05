# OpenBeken channel decoder — isolated preview preparation

This folder contains an **unconnected** decoder and unit tests for the NEO Coolcam
NAS-MA02W6-V1 OpenBeken MQTT format described by
https://github.com/kedube/tuya-smart-mousetrap .

- `<prefix>/1/get`: `1` catch, `0` reset
- `<prefix>/2/get`: battery percentage `100`, `75`, `50`, `25`
- `<prefix>/3/get`: low-battery indication, not a catch event

Run: `node --test ops/hp2/openbeken-channel-decoder.test.mjs` from this generated project's root.

**Not connected to production or HP2.** No runtime scripts import this decoder.
Do not assume Mouse #10 publishes these topics until its actual firmware is verified.
Do not forward retained messages to customer alarms: retained state is historical,
not evidence of a new catch. Never infer a mouse's branch from a topic name;
require an authenticated, explicit device mapping before sending an event.
The existing gateway points to live pestcontrol.cat and must remain untouched.
