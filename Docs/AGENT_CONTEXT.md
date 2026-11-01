# 🤖 BHOOMI DRISHTI / FLY_HEXa_Dash — AI & Developer Handover Guide

> **Target Audience**: Autonomous AI Agents (Claude, GPT, Gemini, Cursor, Devin, Copilot) & Aerospace Software Engineers  
> **Purpose**: Single-source-of-truth system manual explaining the entire software architecture, hardware data flow, telemetry bridges, Three.js 3D graphics, Leaflet GIS mapping, calibration math, and development rules.

---

## 1. High-Level System Architecture

BHOOMI DRISHTI (FLY_HEXa_Dash) is a **hybrid desktop/browser Ground Control Station (GCS)** built for enterprise cadastral land mapping (SVAMITVA Scheme), real-time UAV telemetry monitoring, and 3D digital twin visualization.

```
                      +---------------------------------------+
                      |       UAV Hardware / SITL             |
                      |  Pixhawk 4/6X running ArduPilot 4.5+  |
                      +-------------------+-------------------+
                                          |
                        [USB COM8 @ 115200] or [SiK Radio COM5 @ 57600]
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| Python Backend Gateway: bridge.py                                                 |
|                                                                                   |
|  [Background Thread: mavlink_worker]                                              |
|    - pymavlink connection pool (auto-detects COM8 / COM5 / others)                |
|    - Non-blocking FIFO queue draining (up to 30 packets/tick)                     |
|    - Dynamic stream rate requests (prevents radio bandwidth saturation)           |
|    - Parses: HEARTBEAT, ATTITUDE, VFR_HUD, GLOBAL_POSITION_INT, GPS_RAW_INT,     |
|              SYS_STATUS, EKF_STATUS_REPORT, VIBRATION, RC_CHANNELS, STATUSTEXT    |
|    - Synchronizes to thread-safe dictionary: `mav_state`                          |
|                                                                                   |
|  [FastAPI HTTP / WebSocket Server on port 8000]                                   |
|    - 50Hz WebSocket broadcast loop (`/ws`) delivering JSON telemetry packets      |
|    - REST Endpoints: `/api/telemetry`, `/api/ports`, `/api/switch-port`           |
|    - Static File Server: `/`, `/css`, `/js` with aggressive `no-cache` middleware |
+-----------------------------------------+-----------------------------------------+
                                          |
                            WebSocket (50Hz) + HTTP REST
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| Browser Frontend Single Page Application: index.html (Vanilla JS + CSS)           |
|                                                                                   |
|  Global Reactive State: `window.bhoomiState` (managed in js/app.js)               |
|                                                                                   |
|  View 01: Overview (js/views/overview.js)                                         |
|    - FPV Cockpit HUD (WebRTC / UVC 5.8GHz USB WebCam input)                       |
|    - Mini-Map preview with cadastral SVAMITVA polygon                             |
|                                                                                   |
|  View 02: Telemetry & Sensors (js/views/telemetry.js)                             |
|    - Chart.js real-time charts (Altitude/Speed, Battery V/A, 3-Axis Vibration)    |
|    - 6-Rotor ESC Bus telemetry table (Hexa-X)                                     |
|                                                                                   |
|  View 03: Flight Controller Health (js/views/fcHealth.js)                         |
|    - EKF3 Kalman filter lane health (Velocity, Horiz, Vert, Mag, Terrain)         |
|    - 16-Channel RC Transmitter PWM Bar Monitor                                    |
|                                                                                   |
|  View 04: Live Orientation (js/views/orientation.js)                              |
|    - Three.js 3D Hexacopter (X-frame) model with 6 alternating CW/CCW props       |
|    - Multi-point studio lighting (Zenith overhead, sun key, fills, under-glow)    |
|    - Safe client-side 6-axis visual calibration wizard (0 writes to Pixhawk)      |
|    - Compass rose & PFD artificial horizon                                        |
|                                                                                   |
|  View 05: Land Mapping Workspace (js/views/mapping.js)                            |
|    - Leaflet.js GIS workspace with live drone GPS tracking                        |
|    - Khasra parcel polygons, survey flight transect paths, GeoJSON export         |
|    - Multi-layer basemap switcher (OSM, Humanitarian, Satellite Ortho, Cadastre)   |
|                                                                                   |
|  View 06: Survey History & Logs (js/views/surveyHistory.js)                       |
|  View 07: Alerts & System Events (js/views/alerts.js)                             |
|  View 08: Device Settings & Radio Bus (js/views/settings.js)                      |
+-----------------------------------------------------------------------------------+
```

---

## 2. Directory & File Inventory

```text
c:\Users\meapu\OneDrive\Desktop\BHOOMIDRISHTI\
├── bridge.py                  # Core backend: FastAPI server + MAVLink serial reader + 50Hz WebSocket broadcaster
├── index.html                 # Main SPA HTML container (includes all view layouts, modals, and Tailwind config)
├── run_bhoomigcs.bat          # 1-click Windows startup script (auto-picks Python 3.12)
├── stop_bhoomigcs.bat         # 1-click Windows shutdown script (kills process on port 8000)
├── README.md                  # Public documentation and setup overview
│
├── Docs/                      # Comprehensive Documentation Suite
│   ├── README.md              # Documentation portal index
│   ├── AGENT_CONTEXT.md       # Complete AI Agent & codebase handover guide (This document)
│   ├── SETUP_GUIDE.md         # Full installation, environment, and troubleshooting guide
│   ├── ARCHITECTURE.md        # Technical data flow and WebSocket streaming architecture
│   ├── HEXACOPTER_3D_TWIN.md  # Three.js 3D model, lighting, and client-side calibration wizard
│   └── HARDWARE_MAVLINK.md    # Hardware connections, telemetry radios, and MAVLink messages
│
├── css/
│   └── styles.css             # Lovable dark theme styles, glassmorphic cards, glowing active nav pill, Leaflet overrides
│
├── js/
│   ├── app.js                 # Global state (`window.bhoomiState`), WebSocket client, view router (`window.navigateTo`)
│   └── views/
│       ├── overview.js        # View 01: Cockpit HUD, FPV camera feed, and mini-map
│       ├── telemetry.js       # View 02: Chart.js graphs (alt/speed, battery, vibe) & 6-rotor ESC metrics
│       ├── fcHealth.js        # View 03: EKF3 lane variance meters & 16-channel RC monitor
│       ├── orientation.js     # View 04: Three.js 3D Hexacopter X-model, studio lighting, visual calibration wizard
│       ├── mapping.js         # View 05: Leaflet GIS workspace, Khasra parcel polygons, live GPS tracking, GeoJSON export
│       ├── surveyHistory.js   # View 06: Cadastral survey mission logs table
│       ├── alerts.js          # View 07: STATUSTEXT MAVLink alarm and event feed
│       └── settings.js        # View 08: Telemetry radio bus parameters (baud, net ID, power output, RSSI)
│
└── Diagnostic & Utility Scripts:
    ├── test_mavlink.py        # Probes COM5 and COM8 across 57600/115200 baud to test MAVLink heartbeats
    ├── check_sik_radio.py     # Sends AT commands ('+++', 'ATI', 'ATI5') to SiK radio on COM5
    ├── check_raw_radio.py     # Reads raw serial bytes from COM5
    ├── check_telem_params.py  # Diagnostic tool for telemetry serial baud rates
    ├── inspect_stream.py      # Requests all data streams at 10Hz and prints incoming MAVLink packets
    └── listen_com5.py         # Simple passive listener on COM5
```

---

## 3. Technology Stack & Dependencies

### Python Backend
- **Python Version**: Python 3.12 (Located at `C:\Users\meapu\AppData\Local\Programs\Python\Python312\python.exe`)
- **Core Libraries**:
  - `pymavlink` — MAVLink protocol parser and serial connection manager
  - `pyserial` — Low-level RS232 / USB UART serial communication
  - `fastapi` — Asynchronous REST API and WebSocket gateway
  - `uvicorn` — ASGI web server
  - `websockets` — WebSocket protocol implementation

### Frontend Web Technologies
- **Vanilla HTML5 & JavaScript (ES6+)**: Zero build steps, zero node_modules required. Runs directly in any modern browser.
- **Styling**: Vanilla CSS in `css/styles.css` combined with Tailwind CSS CDN (`tailwind.config` embedded in `index.html`).
- **3D Graphics**: `Three.js` (r128) + `OrbitControls.js`.
- **Charts**: `Chart.js` (line charts with 20-sample rolling telemetry history).
- **GIS Mapping**: `Leaflet.js` (v1.9.4) with multi-tile layer support.
- **Icons & Typography**: Google Fonts (`Inter`, `JetBrains Mono`) and `Material Symbols Outlined`.

---

## 4. Hardware Connectivity & Telemetry Pipeline

### Serial Ports & Baud Rates
- **USB Direct (Pixhawk 4 / 6X USB)**: `COM8` @ `115200` baud.
- **Wireless Telemetry Radio (SiK / RFD900X / CP210x)**: `COM5` @ `57600` baud.
- **Auto-Detection (`AUTO`)**: `bridge.py` dynamically probes `COM8` first, then `COM5`, then any other detected COM ports.

### Buffer Lag Prevention (Crucial Architecture Rule)
Wireless radio links (57600 baud) easily suffer from buffer queues if streams are over-requested or messages are read one-by-one with blocking timeouts. `bridge.py` solves this with two critical mechanisms:
1. **Discrete Stream Rate Requests (`configure_stream_rates`)**:
   - High priority (Attitude): 25Hz on radio, 50Hz on USB.
   - Medium priority (VFR HUD, GPS, RC): 4–5Hz on radio, 10Hz on USB.
   - Low priority (Battery, System Status): 2Hz on radio, 5Hz on USB.
   - Re-issued every 15 seconds to ensure the flight controller maintains rates after reboots.
2. **Non-Blocking Serial FIFO Drain**:
   - In each tick of `mavlink_worker()`, up to 30 queued packets are drained in a tight loop using `master.recv_msg()`. This eliminates the multi-second latency typical in naïve MAVLink implementations.

### 50Hz WebSocket Broadcast Schema
The backend pushes a single JSON string every 20ms over `ws://localhost:8000/ws`:
```json
{
  "connected": true,
  "connection_type": "WIRELESS TELEMETRY (COM5)",
  "port": "COM5",
  "target_port": "AUTO",
  "baud": 57600,
  "status_message": "Connected to WIRELESS TELEMETRY (COM5)",
  "system_id": 1,
  "component_id": 1,
  "flight_mode": "LOITER",
  "armed": false,
  "roll": 0.12,
  "pitch": -0.45,
  "yaw": 89.4,
  "rollspeed": 0.0,
  "pitchspeed": 0.0,
  "yawspeed": 0.0,
  "airspeed": 0.0,
  "groundspeed": 0.0,
  "heading": 89,
  "throttle": 0,
  "alt_msl": 142.5,
  "alt_agl": 0.0,
  "climb_rate": 0.0,
  "lat": 28.470211,
  "lon": 77.494297,
  "gps_fix_type": 6,
  "satellites_visible": 24,
  "hdop": 0.65,
  "vdop": 0.85,
  "cpu_load": 32.4,
  "voltage_battery": 24.6,
  "current_battery": 4.2,
  "battery_remaining": 88,
  "ekf_flags": 0,
  "velocity_variance": 0.04,
  "pos_horiz_variance": 0.08,
  "pos_vert_variance": 0.05,
  "compass_variance": 0.01,
  "terrain_alt_variance": 0.0,
  "vibration_x": 0.02,
  "vibration_y": 0.02,
  "vibration_z": 0.03,
  "clipping_0": 0,
  "rc_channels": [1500, 1500, 1000, 1500, 1500, 1000, 1500, 1500, 1500, 1000, 1500, 1500, 1500, 1500, 1500, 1500],
  "imu_temp": 38.6,
  "rssi": 180,
  "rf_dbm": -32.3,
  "last_statustext": "EKF3 IMU0 is using GPS",
  "packets_received": 14250,
  "last_update": 1730438100.2
}
```

---

## 5. 3D Digital Twin Architecture (`orientation.js`)

### Hexacopter (X-Configuration) Geometry
The 3D model is built procedurally using Three.js primitives without external `.obj`/`.gltf` dependencies, ensuring instant rendering and zero asset load latency.
- **Fuselage Core**: Hexagonal prism cylinder (`CylinderGeometry(0.95, 1.10, 0.28, 6)`), rotated 30° (`Math.PI / 6`) so that the 6 vertices align with 30°, 90°, 150°, 210°, 270°, and 330°.
- **Canopy**: Gleaming platinum hexagonal top canopy with SVAMITVA gold crest.
- **Sensor Pod (Nose @ -Z)**: Forward stereoscopic vision pod with dual lenses, red micro-LiDAR element, and gold flight vector arrow.
- **Motor Arms (ArduPilot Hexa-X convention)**:
  - `M1_FR` (+30°, Front-Right): CCW, Green LED
  - `M5_MR` (+90°, Mid-Right): CW, Cyan LED
  - `M4_RR` (+150°, Rear-Right): CCW, Amber LED
  - `M6_RL` (+210°, Rear-Left): CW, Amber LED
  - `M2_ML` (+270°, Mid-Left): CCW, Cyan LED
  - `M3_FL` (+330°, Front-Left): CW, Red LED
- **Propellers**: 6 twin-blade carbon props with anodized gold tips; rotate dynamically during animation loop (`p.cw ? spinSpeed : -spinSpeed`). Armed state increases spin speed.
- **Gimbal & Payload**: 3-axis stabilized Sony a7R full-frame survey camera with 35mm lens barrel and rubber isolator dampers mounted on the belly.
- **Landing Skids**: Silver alloy longitudinal runner skids with curved vertical arch struts.

### Materials & High-Visibility Palette
To avoid the "pitch-black metallic trap" where high metalness reflects a dark sky as pure black, materials use **low metalness and moderate roughness**:
- `surveyorWhiteMat`: `color: 0xf1f5f9, roughness: 0.38, metalness: 0.08` (Diffuse matte white survey shell).
- `canopyPlatinumMat`: `color: 0xffffff, roughness: 0.22, metalness: 0.12`.
- `brightAlloyMat`: `color: 0xe2e8f0, roughness: 0.30, metalness: 0.35` (Bright aircraft silver).
- `motorBellMat`: `color: 0xf59e0b, metalness: 0.92, roughness: 0.18` (Anodized orange/gold).

### Multi-Point Studio Lighting Rig
- **Zenith Overhead Light**: `THREE.DirectionalLight(0xffffff, 2.5)` at `(0, 12, 0)` illuminating the top deck.
- **Sun Key Light**: `THREE.DirectionalLight(0xffffff, 2.2)` at `(4, 12, 7)`.
- **Soft Fill Light**: `THREE.DirectionalLight(0xf1f5f9, 1.4)` at `(-6, 8, 5)`.
- **Electric Cyan Rim**: `THREE.DirectionalLight(0x38bdf8, 1.6)` at `(-8, 5, -7)`.
- **Gold Starboard Rim**: `THREE.DirectionalLight(0xfacc15, 1.4)` at `(8, 5, -7)`.
- **Underbelly Uplight**: `THREE.DirectionalLight(0x93c5fd, 1.2)` at `(0, -6, 2)` eliminating dark shadows.
- **Tone Mapping**: `renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.60;`.
- **`💡 BOOST LIGHT` button**: Cycles exposure between Studio (1.45), Vivid (1.85), and Daylight (1.25).

---

## 6. Client-Side Safe Visual Calibration (`orientation.js`)

### ⚠️ STRICT SAFETY GUARANTEE
**The GCS NEVER writes calibration parameters or commands (`MAV_CMD_PREFLIGHT_CALIBRATION`, `PARAM_SET`) to the physical Pixhawk flight controller.**  
The drone's hardware calibration is already completed. All calibration, axis inversions, and offsets in the GCS are **100% client-side display transformations** stored in the browser's `localStorage` (`bhoomi_ahrs_calibration_v2`).

### Mathematical Transformation Pipeline
When an `ATTITUDE` packet arrives with raw `(pitch, roll, yaw)`:
1. **Offset & Trim Subtraction**:
   $$p_0 = \text{rawPitch} - (\text{pitchOffset} + \text{pitchTrim})$$
   $$r_0 = \text{rawRoll} - (\text{rollOffset} + \text{rollTrim})$$
   $$y_0 = \text{rawYaw} - \text{yawOffset}$$
2. **Board Mounting Rotation Remapping** ($0^\circ, 90^\circ, 180^\circ, 270^\circ$):
   $$\text{rot} = 90^\circ \implies p_r = -r_0, \quad r_r = p_0$$
   $$\text{rot} = 180^\circ \implies p_r = -p_0, \quad r_r = -r_0$$
   $$\text{rot} = 270^\circ \implies p_r = r_0, \quad r_r = -p_0$$
3. **Axis Swapping (Pitch $\leftrightarrow$ Roll)**:
   Swaps pitch and roll if axes are cross-controlled.
4. **Axis Inversions & Three.js Sign Mapping**:
   In Three.js coordinate system where the drone nose points along $-Z$:
   $$\text{droneModelGroup.rotation.x} = \text{pitchRad} \times (\text{invertPitch} ? -1 : 1)$$
   $$\text{droneModelGroup.rotation.z} = \text{rollRad} \times (\text{invertRoll} ? -1 : 1)$$
   $$\text{droneModelGroup.rotation.y} = -\text{yawRad} \times (\text{invertYaw} ? -1 : 1)$$
   *Note: Rotation order is strictly `YXZ` (Aerospace Yaw $\to$ Pitch $\to$ Roll).*

### Mission Planner-Style 6-Axis Alignment Wizard
Users can launch the wizard (`window.startAhrsWizard()`) to walk through 6 physical drone positions:
1. **LEVEL** (table rest) $\to$ captures $p_{\text{level}}, r_{\text{level}}$ as zero baselines.
2. **NOSE UP** (tilted skyward $+70^\circ$) $\to$ checks pitch axis direction.
3. **NOSE DOWN** (tilted groundward $-70^\circ$)
4. **LEFT SIDE** (banked left $80^\circ$)
5. **RIGHT SIDE** (banked right $80^\circ$) $\to$ checks roll axis direction.
6. **BACK** (upside down $180^\circ$)
The wizard automatically calculates whether pitch/roll are swapped and sets `invertPitch` and `invertRoll` flags automatically.

---

## 7. Land Mapping & GIS Workspace (`mapping.js`)

- **Map Engine**: Leaflet.js with custom dark styling in `css/styles.css`.
- **Tile Providers**:
  - `osm`: Standard OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`)
  - `osm-hot`: Humanitarian OSM (`https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png`)
  - `sat`: Esri World Imagery Satellite (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}`)
  - `dark`: CartoDB Dark Matter (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`)
- **Cadastral SVAMITVA Overlay**: Indian land revenue parcel boundaries (Khasra No., Farmer name, Area in hectares, Verification status).
- **Live GPS Tracking**: Updates Leaflet marker position from MAVLink `GLOBAL_POSITION_INT` (`lat`, `lon`). Includes `AUTO-FOLLOW` and `FIT PARCELS` controls.
- **GeoJSON Export**: `window.exportCadastreGeoJSON()` generates and downloads standard GeoJSON FeatureCollections for GIS tools (QGIS, ArcGIS).

---

## 8. Lovable Dark Theme Design System (`css/styles.css` & `index.html`)

- **Palette**:
  - Background Lowest: `#06070a` (Obsidian canvas)
  - Surface Low: `#0b0e17` (Sidebar & nav containers)
  - Surface Container: `#111624` (Cards and panels)
  - Surface High: `#161d2f` (Elevated headers, active pills)
  - Primary: `#38bdf8` (Electric sky cyan)
  - Secondary: `#34d399` (Vibrant emerald for NOMINAL / ONLINE / LIVE)
  - Tertiary: `#fbbf24` (Aviation amber for headings and warnings)
  - Text Primary: `#f8fafc`
  - Text Secondary: `#94a3b8`
- **Glassmorphism**: `.glass-panel` and `.lovable-card` classes with `backdrop-filter: blur(16px)` and subtle borders (`rgba(255, 255, 255, 0.08)`).
- **Navigation Pill**: Active sidebar items use a soft cyan gradient (`rgba(56, 189, 248, 0.14)` $\to$ `0.03`), cyan left border accent (`border-left: 3px solid #38bdf8`), and icon drop-shadow.

---

## 9. Developer Rules & Critical Boundaries for Future AI Agents

> [!IMPORTANT]
> **RULE 1: NEVER Write to Physical Pixhawk Autopilot Parameters**  
> Do not emit `PARAM_SET` or `MAV_CMD_PREFLIGHT_CALIBRATION`. All orientation display fixes must remain client-side in `orientation.js` or `localStorage`.

> [!IMPORTANT]
> **RULE 2: NEVER Push to Git Without Explicit User Permission**  
> The user stated: *"dont push anything in my rpo without my permision"*. Always wait for explicit user confirmation before executing `git push`.

> [!IMPORTANT]
> **RULE 3: Python Environment on Windows**  
> The machine has both Python 3.14 (default without MAVLink packages) and Python 3.12 (`C:\Users\meapu\AppData\Local\Programs\Python\Python312\python.exe` with all packages installed). Always run commands with `C:\Users\meapu\AppData\Local\Programs\Python\Python312\python.exe` or `py -3.12`.

> [!IMPORTANT]
> **RULE 4: Prevent Browser Caching**  
> When modifying static frontend files (`index.html`, `js/*`, `css/*`), update the script query version in `index.html` (e.g. `?v=2.7.x`) to force the browser to invalidate cached scripts. `bridge.py` also includes HTTP middleware enforcing `no-cache` headers.

> [!IMPORTANT]
> **RULE 5: Preserve All Existing DOM IDs and View Bindings**  
> All 8 view navigation routes (`#overview`, `#drone-telemetry`, `#flight-controller-health`, `#live-orientation`, `#land-mapping-workspace`, `#survey-history-logs`, `#alerts-system-events`, `#device-settings`) depend on exact element IDs and global functions (`window.navigateTo`, `window.initOrientation3D`, `window.initTelemetryCharts`, `window.initFCHealth`, `window.initCadastreMap`, `window.initOverviewMiniMap`). Never remove or rename these IDs.

---

## 10. How to Start and Stop the System

### 1-Click Batch Files (Recommended)
- **Start**: Double-click `run_bhoomigcs.bat` $\to$ starts server on `http://localhost:8000`.
- **Stop**: Double-click `stop_bhoomigcs.bat` $\to$ kills process on port 8000.

### Terminal Commands
```bash
# Start server using Python 3.12:
C:\Users\meapu\AppData\Local\Programs\Python\Python312\python.exe bridge.py

# Or using the Windows Python launcher:
py -3.12 bridge.py

# Stop server (PowerShell / CMD):
for /f "tokens=5" %a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %a
```
