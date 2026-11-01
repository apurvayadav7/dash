# 📚 BHOOMI DRISHTI (FLY_HEXa_Dash) — Documentation Portal

Welcome to the comprehensive documentation repository for **BHOOMI DRISHTI | FLY_HEXa_Dash**, an enterprise Ground Control Station (GCS v2.4-RC3) developed for cadastral land mapping (SVAMITVA Scheme), real-time Pixhawk / ArduPilot telemetry, and 3D Hexacopter (X-Frame) digital twin visualization.

---

## 📑 Documentation Index

| Document | Target Audience | Description |
| :--- | :--- | :--- |
| **[SETUP_GUIDE.md](file:///c:/Users/meapu/OneDrive/Desktop/BHOOMIDRISHTI/Docs/SETUP_GUIDE.md)** | Users, Engineers | Step-by-step installation, Python 3.12 environment setup, serial drivers, running with batch scripts, and troubleshooting. |
| **[AGENT_CONTEXT.md](file:///c:/Users/meapu/OneDrive/Desktop/BHOOMIDRISHTI/Docs/AGENT_CONTEXT.md)** | **Autonomous AI Agents**, LLMs, Core Devs | Single-source-of-truth manual detailing complete system architecture, data flow, Three.js 3D model, calibration math, developer rules, and boundaries. |
| **[ARCHITECTURE.md](file:///c:/Users/meapu/OneDrive/Desktop/BHOOMIDRISHTI/Docs/ARCHITECTURE.md)** | Software Architects, Full-Stack Devs | Deep dive into the backend serial FIFO drain, 50Hz WebSocket broadcast loop, REST endpoints, and SPA router. |
| **[HEXACOPTER_3D_TWIN.md](file:///c:/Users/meapu/OneDrive/Desktop/BHOOMIDRISHTI/Docs/HEXACOPTER_3D_TWIN.md)** | 3D Graphics Devs, Pilots | Procedural Three.js Hexacopter-X airframe, multi-point studio lighting, and client-side 6-axis visual calibration wizard. |
| **[HARDWARE_MAVLINK.md](file:///c:/Users/meapu/OneDrive/Desktop/BHOOMIDRISHTI/Docs/HARDWARE_MAVLINK.md)** | Avionics & Hardware Engineers | USB (`COM8` @ 115200) vs Telemetry Radio (`COM5` @ 57600), stream rates, MAVLink message types, and diagnostic scripts. |

---

## 🚀 Quick Setup Reference

```bash
# 1. Install dependencies using Python 3.12
py -3.12 -m pip install fastapi uvicorn pyserial pymavlink websockets

# 2. Launch the telemetry bridge
py -3.12 bridge.py
# (Or double click run_bhoomigcs.bat)

# 3. Access the dashboard
http://localhost:8000
```

To stop the background server:
- Double click `stop_bhoomigcs.bat`
