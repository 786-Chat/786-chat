# Dell Food Safety IoT Gateway — Windows 11 Setup

This runbook prepares the existing Dell OptiPlex 3060 Micro as the first Food Safety owned-IoT gateway.

Target flow:

```text
BK7231N mouse trap
  -> 2.4 GHz Wi-Fi
  -> Virgin Media router
  -> Dell Food Safety Gateway
       - Mosquitto MQTT broker
       - Food Safety ingestion service
       - optional local diagnostics
  -> Neon / Food Safety web application
```

The PBX is not required for Phase 1. Grandstream/UCM call alerts can be added after trap events are working end-to-end.

## 1. Windows preparation

Use the Dell on wired Ethernet where possible. Keep Wi-Fi available for testing but do not rely on Wi-Fi for the gateway itself if Ethernet is available.

Recommended Windows settings:

1. Install all Windows security updates.
2. Set the computer name to `FOODSAFETY-GW01`.
3. Set the active Ethernet network profile to `Private`.
4. Disable sleep while plugged in so the gateway stays online.
5. Keep Windows Defender Firewall enabled.
6. Create a dedicated non-admin Windows account for normal gateway service operation later.

PowerShell (run as Administrator):

```powershell
Rename-Computer -NewName "FOODSAFETY-GW01"
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
```

Restart after renaming.

## 2. Secure remote access

For the prototype, use Tailscale rather than exposing Windows RDP or SSH directly to the public internet.

Install Tailscale for Windows, sign in, and confirm the Dell appears in the Tailscale Machines list.

Then enable Windows OpenSSH Server so remote command-line maintenance is possible over the private Tailscale address only.

Administrator PowerShell:

```powershell
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH.Server*'
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
Start-Service sshd
Set-Service -Name sshd -StartupType Automatic
```

Verify:

```powershell
Get-Service sshd
```

Do not create a Virgin router port-forward for TCP 22 or RDP 3389.

## 3. Install gateway software

Install these components on the Dell:

- Git for Windows
- Node.js LTS
- Eclipse Mosquitto 64-bit for Windows
- Tailscale
- OpenSSH Server Windows capability
- Python 3 (needed later for BK7231N flashing tools)

Clone the existing repository and checkout the owned-IoT branch:

```powershell
git clone https://github.com/786-Chat/786-chat.git C:\FoodSafety\786-chat
cd C:\FoodSafety\786-chat
git checkout feature/food-safety-owned-iot
```

## 4. Mosquitto directories

Create local folders that are not committed to Git:

```powershell
New-Item -ItemType Directory -Force C:\FoodSafety\mqtt\config
New-Item -ItemType Directory -Force C:\FoodSafety\mqtt\data
New-Item -ItemType Directory -Force C:\FoodSafety\mqtt\log
New-Item -ItemType Directory -Force C:\FoodSafety\secrets
```

Copy `services/food-safety-iot/gateway/mosquitto.conf.example` to:

```text
C:\FoodSafety\mqtt\config\mosquitto.conf
```

Create an MQTT password file locally. Never commit it:

```powershell
& 'C:\Program Files\mosquitto\mosquitto_passwd.exe' -c 'C:\FoodSafety\secrets\mqtt.passwd' food-safety-ingestion
```

For the first physical trap, create a separate per-device username instead of sharing the ingestion credential:

```powershell
& 'C:\Program Files\mosquitto\mosquitto_passwd.exe' 'C:\FoodSafety\secrets\mqtt.passwd' FS-MOUSE-000001
```

## 5. First local broker test

Start Mosquitto in verbose foreground mode first:

```powershell
& 'C:\Program Files\mosquitto\mosquitto.exe' -c 'C:\FoodSafety\mqtt\config\mosquitto.conf' -v
```

In a second PowerShell window, subscribe:

```powershell
& 'C:\Program Files\mosquitto\mosquitto_sub.exe' -h 127.0.0.1 -p 1883 -u food-safety-ingestion -P '<LOCAL_PASSWORD>' -t 'fs/v1/device/+/+' -v
```

Do not store the real password in shell history after testing. Move credentials to a protected local `.env` file or Windows service secret mechanism.

## 6. Run the existing simulator

From the branch:

```powershell
cd C:\FoodSafety\786-chat\services\food-safety-iot
npm install
```

Create a local `.env` from `.env.example`. Use:

```text
MQTT_URL=mqtt://127.0.0.1:1883
MQTT_USERNAME=FS-MOUSE-000001
MQTT_PASSWORD=<device-specific-password>
DEVICE_ID=FS-MOUSE-000001
HARDWARE_MODEL=FS-MOUSE-BK7231N-V1
FIRMWARE_VERSION=0.1.0-sim
AUTO_TRIGGER_SECONDS=20
```

Run the simulator using the package script already defined in this service.

Success criteria:

- broker accepts the device connection;
- status appears on `fs/v1/device/FS-MOUSE-000001/status`;
- one `trap_triggered` event appears on `fs/v1/device/FS-MOUSE-000001/event`;
- no Tuya/Smart Life service is involved.

## 7. LAN firewall

During the first physical-device test, allow MQTT TCP 1883 only from the local Private network. Do not expose 1883 to the internet.

After the prototype works, move to MQTT over TLS on 8883 with per-device credentials/certificates and tighten firewall rules.

## 8. Ingestion service

The existing `services/food-safety-iot/ingestion-service.ts` subscribes to the Food Safety MQTT topic tree and writes device status/events to PostgreSQL.

Before running it against Neon:

1. apply the owned-device SQL schema to the intended test database;
2. pre-register `FS-MOUSE-000001`;
3. assign it to the correct test customer/branch;
4. set `DATABASE_URL` only in the Dell's local protected environment;
5. start ingestion and verify one simulator event reaches the database.

Do not use production branch/customer records for the first hardware flash test.

## 9. Service hardening after the first test

After MQTT + simulator + database are proven:

- run Mosquitto as a Windows service;
- run the ingestion process under a dedicated service account;
- configure automatic restart;
- enable broker persistence;
- replace port 1883 device traffic with TLS 8883;
- implement ACLs so each device can publish only to its own topics;
- schedule encrypted gateway backups for configuration only (never copy plaintext secrets into Git);
- add health monitoring to the Food Safety admin dashboard.

## 10. Definition of Phase-1 Dell success

The Dell gateway is ready when all of these are true:

- it remains awake continuously;
- Tailscale remote access works;
- SSH works only through the private access path;
- Mosquitto starts reliably;
- the existing simulator publishes heartbeat and trap events;
- the ingestion service can write those events to the test database;
- no inbound router port forwarding is required;
- no Tuya cloud is required.
