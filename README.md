# FLY_HEXa_Dash — BHOOMI DRISHTI | Hexacopter Ground Control Station (GCS v2.4-RC3)

> **"See the Land. Map the Truth."**  
> An enterprise-grade, browser-based UAV Ground Control Station tailored for cadastral land mapping (SVAMITVA Scheme), real-time Pixhawk / ArduPilot telemetry, and 3D Hexacopter (X-Frame) digital twin visualization with Lovable-inspired dark theme aesthetics.

---

## 🌟 Key Features

### 1. 🛩️ Real-Time 3D Hexacopter Digital Twin (AHRS - X Frame)
- **High-Visibility Airframe**: High-contrast surveyor matte white airframe with platinum canopy, anodized gold motor bells, and cyan/amber navigation LED strips.
- **Three.js Multi-Point Studio Lighting Rig**: Zenith overhead light, hemisphere soft fill, sun key, and rim lighting with ACES Filmic tone mapping.
- **Dynamic 6-DOF Synchronization**: Smooth pitch, roll, and yaw representation directly fed from MAVLink `ATTITUDE` and `VFR_HUD`.
- **Mission Planner-Style 6-Axis Alignment Wizard**: Safe, client-side visual display calibration wizard (Level, Nose Up, Nose Down, Left, Right, Upside Down) with zero writes to Pixhawk flight controller hardware parameters.
- **Camera Views & Quick Actions**: `NORTH-UP`, `TOP`, `CHASE`, `FRONT`, `ISO`, and `💡 BOOST LIGHT` mode toggle.

### 2. 🗺️ Land Mapping Workspace (GIS / SVAMITVA Scheme)
- **Interactive Leaflet Mapping**: Live drone GPS coordinates tracking with auto-follow and parcel fitting.
- **Cadastral Polygon Visualizer**: Interactive SVAMITVA Khasra parcel overlays with boundary calculation and area computation.
- **Multi-Source Basemaps**: Seamless switching between OpenStreetMap, Humanitarian OSM, Satellite Ortho, and Dark Cadastre Vector tiles.
- **GeoJSON Export**: Instant download of survey flight transects and parcel boundaries.

### 3. 📊 Full Telemetry & Sensor Suite
- **Primary Flight Instruments**: Airspeed, groundspeed, altitude AGL/MSL, vertical climb rate, and throttle gauges.
- **Vibration & Dynamics Analysis**: 3-axis accelerometer and gyro vibration time-series graphs (`VIBE` MAVLink message).
- **Power Monitoring**: Real-time battery voltage, current draw, remaining capacity, and estimated flight time.
- **Per-Rotor ESC Bus**: Live RPM, current, and temperature readouts for quadcopter propulsion systems.

### 4. 🩺 Flight Controller Health (Pixhawk & ArduPilot)
- **EKF3 Kalman Filter Diagnostics**: Multi-lane tracking for velocity, horizontal position, vertical height, compass magnetic variance, and terrain altitude.
- **Compute Core Metrics**: STM32 MCU load, free RAM, Flash CRC integrity, and sensor bus status (DroneCAN, SPI, I2C).
- **16-Channel Radio Monitor**: Live SBUS / CRSF PWM input bars for all 16 transmitter channels with link quality indicators.

### 5. 📻 Hardware Connectivity & Radio Bus
- **Dynamic Port Switcher**: Automatic switching between Telemetry Radio (`COM5` @ 57600 baud) and USB Direct (`COM8` @ 115200 baud).
- **Silicon Labs CP210x / RFD900X Support**: Real-time RSSI signal quality sparklines, FHSS Net ID configuration, and RF power output tuning.

### 6. 🖤 Lovable Dark Theme
- Inspired by modern SaaS design systems (Lovable.dev, Linear, Raycast).
- Deep obsidian dark palette (`#06070a` - `#111624`), electric sky cyan accents (`#38bdf8`), and emerald live indicators (`#34d399`).
- Frosted glassmorphic cards with subtle translucent borders and smooth micro-interactions.

---

## 📚 Complete Documentation Suite

All in-depth technical documentation, AI agent handover manuals, hardware wiring schematics, and architecture documents are maintained in the [`Docs/`](file:///c:/Users/meapu/OneDrive/Desktop/BHOOMIDRISHTI/Docs/) folder:

| Document | Target Audience | Description |
| :--- | :--- | :--- |
| **[`Docs/README.md`](file:///c:/Users/meapu/OneDrive/Desktop/BHOOMIDRISHTI/Docs/README.md)** | All Users | Documentation index & high-level overview. |
| **[`Docs/AGENT_CONTEXT.md`](file:///c:/Users/meapu/OneDrive/Desktop/BHOOMIDRISHTI/Docs/AGENT_CONTEXT.md)** | **Autonomous AI Agents**, LLMs, Core Devs | Single-source-of-truth manual detailing complete system architecture, data flow, Three.js 3D model, calibration math, developer rules, and boundaries. |
| **[`Docs/SETUP_GUIDE.md`](file:///c:/Users/meapu/OneDrive/Desktop/BHOOMIDRISHTI/Docs/SETUP_GUIDE.md)** | Users, Engineers | Step-by-step installation, Python 3.12 environment setup, serial drivers, running with batch scripts, and troubleshooting. |
| **[`Docs/ARCHITECTURE.md`](file:///c:/Users/meapu/OneDrive/Desktop/BHOOMIDRISHTI/Docs/ARCHITECTURE.md)** | Software Architects, Full-Stack Devs | Deep dive into the backend serial FIFO drain, 50Hz WebSocket broadcast loop, REST endpoints, and SPA router. |
| **[`Docs/HEXACOPTER_3D_TWIN.md`](file:///c:/Users/meapu/OneDrive/Desktop/BHOOMIDRISHTI/Docs/HEXACOPTER_3D_TWIN.md)** | 3D Graphics Devs, Pilots | Procedural Three.js Hexacopter-X airframe, multi-point studio lighting, and client-side 6-axis visual calibration wizard. |
| **[`Docs/HARDWARE_MAVLINK.md`](file:///c:/Users/meapu/OneDrive/Desktop/BHOOMIDRISHTI/Docs/HARDWARE_MAVLINK.md)** | Avionics & Hardware Engineers | USB (`COM8` @ 115200) vs Telemetry Radio (`COM5` @ 57600), stream rates, MAVLink message types, and diagnostic scripts. |

---

## 🚀 Quick Start & Setup

### Prerequisites
- **Python 3.10 – 3.12** (*Python 3.12 recommended*)
- **Pixhawk Autopilot** or **SITL Simulator** running ArduPilot Copter 4.5+ or PX4 v1.14+
- Modern Web Browser (Chrome, Edge, Firefox, Brave)

### 1. Install Dependencies
```bash
# Using the Windows Python 3.12 launcher:
py -3.12 -m pip install fastapi uvicorn pyserial pymavlink websockets

# Or using standard pip:
pip install fastapi uvicorn pyserial pymavlink websockets
```

### 2. Run the Ground Control Station
- **Option A (One-Click)**: Double-click `run_bhoomigcs.bat`.
- **Option B (Terminal)**:
  ```bash
  py -3.12 bridge.py
  ```

### 3. Open the Web Dashboard
Navigate to:
```text
http://localhost:8000
```

### 4. Stop the Server
- Double-click `stop_bhoomigcs.bat` to release port 8000 and terminate the background process cleanly.

---

## 📁 Repository Structure

```text
c:\Users\meapu\OneDrive\Desktop\BHOOMIDRISHTI\
├── bridge.py             # FastAPI WebSocket MAVLink serial telemetry bridge
├── index.html            # Main GCS Single Page Application shell
├── run_bhoomigcs.bat     # One-click Windows startup batch script
├── stop_bhoomigcs.bat    # One-click Windows shutdown batch script
├── README.md             # This overview document
│
├── Docs/                 # Comprehensive Documentation Directory
│   ├── README.md         # Documentation index & portal
│   ├── AGENT_CONTEXT.md  # All-in-one AI agent handover guide
│   ├── SETUP_GUIDE.md    # Detailed environment & troubleshooting guide
│   ├── ARCHITECTURE.md   # Data flow & WebSocket streaming architecture
│   ├── HEXACOPTER_3D_TWIN.md # Three.js 3D model, lighting & calibration
│   └── HARDWARE_MAVLINK.md # Serial interfaces, radio AT commands & packet IDs
│
├── css/
│   └── styles.css        # Lovable dark theme styles, glassmorphism & Leaflet customization
│
├── js/
│   ├── app.js            # Global state, router, and WebSocket telemetry stream handler
│   └── views/
│       ├── overview.js   # Cockpit dashboard, FPV HUD & avionic subsystems
│       ├── telemetry.js  # Chart.js telemetry graphs & gauges
│       ├── fcHealth.js   # EKF3 lane variance & 16-channel RC monitor
│       ├── orientation.js# Three.js 3D drone digital twin & calibration wizard
│       ├── mapping.js    # Leaflet GIS cadastral map planner
│       ├── surveyHistory.js # Cadastral mission logs & reports
│       ├── alerts.js     # STATUSTEXT event feed & alarms
│       └── settings.js   # Radio transceiver bus & vehicle parameters
│
└── Diagnostic & Utility Scripts:
    ├── test_mavlink.py   # Diagnostic script for MAVLink telemetry ports
    ├── check_sik_radio.py# Diagnostic tool for SiK telemetry radio AT commands
    ├── check_raw_radio.py# Raw serial byte dumper
    └── inspect_stream.py # 10Hz MAVLink data stream inspector
```

---

## 🔒 Safety Notice
All visual orientation display calibration, axes swapping, and offsets configured in the GCS are **strictly client-side in the browser**. Physical Pixhawk flight controller hardware calibration and ArduPilot onboard parameters are **100% untouched**.

---

## 📜 License
Distributed under the MIT License. Developed for advanced survey operations and drone telemetry monitoring.

