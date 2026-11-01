# 📡 Hardware Interfaces & MAVLink Protocols — BHOOMI DRISHTI

This document covers physical hardware wiring, telemetry radio interfaces, serial COM port parameters, diagnostic scripts, and MAVLink packet schemas used by **BHOOMI DRISHTI**.

---

## 1. Supported Hardware & Interfaces

| Interface | Default Port | Baud Rate | Typical Hardware |
| :--- | :--- | :--- | :--- |
| **USB Direct** | `COM8` | **115,200** | Pixhawk 4, Pixhawk 6X, Cube Orange (Direct USB Type-C) |
| **Telemetry Radio** | `COM5` | **57,600** | SiK Telemetry Radio, Holybro 433/915MHz, RFD900X, CP210x USB bridge |
| **SITL Simulation** | `127.0.0.1:14550` | UDP / TCP | ArduPilot Software-In-The-Loop (SITL) |

---

## 2. SiK Telemetry Radio Configuration

SiK and RFD900X radios use standard Hayes `+++` AT command syntax:
- Enter AT mode: Send `+++` after 1 second of guard silence.
- Query radio identity: `ATI` $\to$ Returns firmware version and device model.
- Query EEPROM settings: `ATI5` $\to$ Returns Net ID, TX Power, Frequency band, and Air Data Rate.
- Exit AT mode: `ATO`.

### Diagnostic Script: `check_sik_radio.py`
Use this tool to verify whether your SiK radio is connected and responsive:
```bash
py -3.12 check_sik_radio.py
```
Expected output:
```text
=== SiK Radio AT Command Test on COM5 ===
Connecting to COM5 at 57600...
Waiting 1.2s before +++...
Sending '+++'...
Radio Response:
  ATI: SiK 2.0 on HM-TRP
  ATI5: S0: FORMAT=25, S1: SERIAL_SPEED=57, S2: AIR_SPEED=64, S3: NETID=25, S4: TXPOWER=20
```

---

## 3. Diagnostic & Utility Scripts Suite

The project includes purpose-built Python diagnostic tools in the root directory:

| Script | Purpose | Usage |
| :--- | :--- | :--- |
| **`test_mavlink.py`** | Scans `COM8` and `COM5` across both `57600` and `115200` baud rates to detect MAVLink `HEARTBEAT` messages. | `py -3.12 test_mavlink.py` |
| **`check_sik_radio.py`** | Probes the radio using AT commands (`+++`, `ATI`, `ATI5`) to diagnose link parameters. | `py -3.12 check_sik_radio.py` |
| **`check_raw_radio.py`** | Reads and dumps raw incoming bytes from `COM5` to verify physical RF data transmission. | `py -3.12 check_raw_radio.py` |
| **`check_telem_params.py`**| Probes telemetry stream baud configurations. | `py -3.12 check_telem_params.py` |
| **`inspect_stream.py`** | Requests all MAVLink data streams at 10Hz and prints parsed packet types. | `py -3.12 inspect_stream.py` |
| **`listen_com5.py`** | Passive listener on `COM5` for debugging serial port lock issues. | `py -3.12 listen_com5.py` |

---

## 4. Key MAVLink Messages Parsed by `bridge.py`

| Message Name | ID | Fields Captured | Frontend Destination |
| :--- | :--- | :--- | :--- |
| **`HEARTBEAT`** | 0 | `custom_mode`, `base_mode`, `system_status` | Armed badge, Flight Mode badge (LOITER, RTL, STABILIZE, AUTO) |
| **`ATTITUDE`** | 30 | `roll`, `pitch`, `yaw`, `rollspeed`, `pitchspeed`, `yawspeed` | 3D Hexacopter twin (`orientation.js`), PFD Artificial Horizon |
| **`VFR_HUD`** | 74 | `airspeed`, `groundspeed`, `heading`, `throttle`, `alt`, `climb` | Cockpit HUD, Overview gauges, Telemetry graphs |
| **`GLOBAL_POSITION_INT`** | 33 | `lat`, `lon`, `alt`, `relative_alt`, `vx`, `vy`, `vz`, `hdg` | Leaflet Cadastral Map marker, Live GPS tracking, Transect flight path |
| **`GPS_RAW_INT`** | 24 | `fix_type`, `satellites_visible`, `eph` (HDOP), `epv` (VDOP) | GPS Health indicator, Satellite count pill |
| **`SYS_STATUS`** | 1 | `voltage_battery`, `current_battery`, `battery_remaining`, `load` | Battery indicator, ESC bus, STM32 MCU load |
| **`EKF_STATUS_REPORT`** | 193 | `velocity_variance`, `pos_horiz_variance`, `pos_vert_variance`, `compass_variance`, `terrain_alt_variance` | Flight Controller Health EKF3 meters (`fcHealth.js`) |
| **`VIBRATION`** | 241 | `vibration_x`, `vibration_y`, `vibration_z`, `clipping_0` | Telemetry Vibration time-series chart (`telemetry.js`) |
| **`RC_CHANNELS`** | 65 | `chan1_raw` through `chan16_raw` | 16-channel SBUS / CRSF PWM input bars (`fcHealth.js`) |
| **`STATUSTEXT`** | 253 | `severity`, `text` | Alarm event feed, Pre-arm failure notifications (`alerts.js`) |
