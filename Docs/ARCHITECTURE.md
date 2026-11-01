# 🏗️ System Architecture & Data Pipeline — BHOOMI DRISHTI

This document provides a deep architectural breakdown of **BHOOMI DRISHTI (FLY_HEXa_Dash)**, detailing how MAVLink serial packets flow from physical autopilot hardware into the browser at 50Hz with sub-millisecond lag.

---

## 1. End-to-End Data Pipeline

```
+-------------------------------------------------------------+
|             UAV Hardware: Pixhawk 4 / Cube Orange            |
|                Running ArduPilot 4.5+ Copter                |
+------------------------------+------------------------------+
                               |
                   MAVLink v2.0 Serial Stream
           [COM8 @ 115200 (USB)] or [COM5 @ 57600 (SiK Radio)]
                               |
                               v
+-------------------------------------------------------------+
| Backend Service: bridge.py                                  |
|                                                             |
|   1. Serial Connection Engine (pymavlink mavutil)           |
|      - Auto-detection across COM8, COM5, and OS ports       |
|      - Stream Rate Management: 25Hz / 5Hz / 2Hz requests    |
|                                                             |
|   2. Non-Blocking FIFO Packet Draining Loop                 |
|      - Drains up to 30 queued packets per tick              |
|      - Zero-latency parsing of MAVLink packet types         |
|                                                             |
|   3. State Aggregation (`mav_state` dictionary)             |
|      - Thread-safe updates of 6-DOF, GPS, Battery, EKF      |
|                                                             |
|   4. 50Hz Broadcast Loop (FastAPI WebSocket)                |
|      - Serializes state to JSON every 20ms                  |
|      - Pushes to connected browser clients over /ws         |
+------------------------------+------------------------------+
                               |
                    WebSocket ws://localhost:8000/ws
                               |
                               v
+-------------------------------------------------------------+
| Frontend Single Page Application: index.html                |
|                                                             |
|   1. Global Reactive Store: `window.bhoomiState` (app.js)   |
|      - Maintains normalized telemetry cache                 |
|      - Triggers component render callbacks                  |
|                                                             |
|   2. Subsystem Views:                                       |
|      - overview.js: HUD & Mini-map                          |
|      - telemetry.js: Chart.js vibration/battery graphs      |
|      - fcHealth.js: EKF3 variance & RC channel bars         |
|      - orientation.js: Three.js Hexacopter 3D digital twin  |
|      - mapping.js: Leaflet cadastral GIS workspace          |
|      - alerts.js: STATUSTEXT alarm stream                   |
|      - settings.js: Radio transceiver bus tuning            |
+-------------------------------------------------------------+
```

---

## 2. Low-Latency Serial Draining Engine

In standard MAVLink bridges, calling blocking `master.recv_match(blocking=True, timeout=0.1)` introduces serial buffer accumulation when incoming packets arrive faster than processing ticks, resulting in severe 3-to-10 second lag on 57600 baud wireless radios.

`bridge.py` eliminates this through **non-blocking tight FIFO draining**:

```python
# Extract from bridge.py:
for _ in range(30):
    msg = master.recv_msg()
    if not msg:
        break
    # Process msg immediately without yielding
    msg_type = msg.get_type()
    # Update mav_state...
```

By processing up to 30 packets per loop iteration and yielding only `time.sleep(0.005)` (5ms) when the serial buffer is empty, latency from physical drone movement to browser visualization is kept under **25 milliseconds**.

---

## 3. Dynamic MAVLink Stream Rate Negotiation

To prevent radio bandwidth saturation over 57600 baud links (which have an effective payload throughput of ~4-5 KB/s), `bridge.py` configures discrete data stream rates using `MAV_CMD_SET_MESSAGE_INTERVAL`:

| Data Stream | MAVLink Message | Radio Baud (57600) | USB Baud (115200) | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Attitude** | `ATTITUDE` (30) | **25 Hz** | **50 Hz** | 3D Digital Twin & AHRS horizon |
| **VFR HUD** | `VFR_HUD` (74) | **5 Hz** | **10 Hz** | Speed, altitude, climb rate |
| **GPS Position** | `GLOBAL_POSITION_INT` (33) | **4 Hz** | **10 Hz** | Map tracking & survey flight transect |
| **RC Channels** | `RC_CHANNELS` (65) | **4 Hz** | **10 Hz** | Transmitter stick monitor |
| **Battery & System** | `SYS_STATUS` (1) | **2 Hz** | **5 Hz** | Voltage, current, MCU load |
| **EKF Health** | `EKF_STATUS_REPORT` (193) | **2 Hz** | **5 Hz** | Kalman filter variance meters |
| **Vibration** | `VIBRATION` (241) | **2 Hz** | **5 Hz** | 3-axis airframe dynamic analysis |

---

## 4. Frontend Single Page Application (SPA) Architecture

### Zero-Build Dependency Stack
The frontend does not require Webpack, Vite, or npm. All libraries are loaded via CDN or native ES6 modules:
- `Three.js` (r128) + `OrbitControls.js`
- `Chart.js` (v4.4.1)
- `Leaflet.js` (v1.9.4)
- `Tailwind CSS` (Play CDN with embedded theme configuration)

### Routing Architecture (`window.navigateTo`)
Navigation between the 8 subsystem views is managed by a lightweight client router in `js/app.js`:
1. Hides all `.view-panel` elements (`display: none`).
2. Activates the target view matching the hashtag route (e.g. `#live-orientation`).
3. Updates the active sidebar navigation pill styling.
4. Triggers view-specific lifecycle initializers:
   - `#live-orientation` $\to$ `window.initOrientation3D()`
   - `#drone-telemetry` $\to$ `window.initTelemetryCharts()`
   - `#flight-controller-health` $\to$ `window.initFCHealth()`
   - `#land-mapping-workspace` $\to$ `window.initCadastreMap()`

---

## 5. Aggressive Cache Busting Middleware

Because `bridge.py` serves the frontend directly, browser caching of local JavaScript files can prevent code edits from appearing in the client.

`bridge.py` includes custom FastAPI middleware that forces browsers to validate assets on every reload:
```python
@app.middleware("http")
async def add_no_cache_headers(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.endswith((".js", ".css", ".html")):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response
```
In addition, `index.html` references all scripts with a cache-busting query parameter:
```html
<script src="js/views/orientation.js?v=2.7.5"></script>
```
