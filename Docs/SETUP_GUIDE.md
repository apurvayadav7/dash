# 🛠️ Installation & Setup Guide — BHOOMI DRISHTI (FLY_HEXa_Dash)

This guide walks you through setting up and running **BHOOMI DRISHTI** on Windows, Linux, or macOS.

---

## 1. System Requirements

### Hardware Requirements
- **Workstation / Laptop**: Minimum 4-core CPU, 8GB RAM, WebGL 2.0-compatible GPU (Intel Iris, NVIDIA, AMD, or Apple Silicon).
- **Flight Controller**: Pixhawk 4 / 6X / Cube Orange or equivalent running **ArduPilot Copter 4.4+** or **PX4 v1.14+**.
- **Telemetry Hardware**:
  - Direct USB Type-C / Micro-USB cable to flight controller.
  - OR 433MHz / 868MHz / 915MHz SiK Telemetry Radio pair (e.g., Holybro, RFD900X, or Silicon Labs CP210x USB bridge).
- **FPV Video (Optional)**: 5.8GHz UVC OTG USB Video Receiver (e.g., Eachine ROTG02) for real-time FPV cockpit feed.

### Software Prerequisites
- **Python**: **Python 3.12** is recommended.
  > [!WARNING]
  > On Windows systems with multiple Python installations (e.g., Python 3.14 alongside 3.12), ensure packages are installed into Python 3.12, as `pymavlink` pre-built wheels are most stable on 3.10–3.12.
- **Web Browser**: Google Chrome, Microsoft Edge, Brave, or Mozilla Firefox with hardware acceleration enabled.

---

## 2. Windows USB Driver Setup

If your telemetry radio or Pixhawk is not recognized:
1. **SiK Radio / CP210x Bridge**: Download and install the Silicon Labs CP210x VCP Drivers. Once installed, it typically maps to `COM5` or similar.
2. **Pixhawk Direct USB**: Installs as an STMicroelectronics Virtual COM Port (`COM8` or similar).

To verify ports in PowerShell:
```powershell
[System.IO.Ports.SerialPort]::GetPortNames()
```

---

## 3. Python Environment & Dependency Installation

### Option A: Direct Installation (Quickest)
Open PowerShell or Command Prompt:

```bash
# Verify Python version (Ensure 3.10 - 3.12)
py -3.12 --version

# Upgrade pip
py -3.12 -m pip install --upgrade pip

# Install required packages
py -3.12 -m pip install fastapi uvicorn pyserial pymavlink websockets
```

### Option B: Dedicated Virtual Environment (Isolated)
```bash
# Create virtual environment with Python 3.12
py -3.12 -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows CMD:
.\venv\Scripts\activate.bat

# Install dependencies
pip install fastapi uvicorn pyserial pymavlink websockets
```

---

## 4. Running the Ground Control Station

### Method 1: One-Click Windows Batch Script
Simply double-click:
```text
run_bhoomigcs.bat
```
This script automatically:
1. Detects Python 3.12 (`C:\Users\meapu\AppData\Local\Programs\Python\Python312\python.exe` or `py -3.12`).
2. Checks port 8000 and clears any zombie processes.
3. Launches `bridge.py` on `http://localhost:8000`.

### Method 2: Manual Terminal Execution
```bash
py -3.12 bridge.py
```
Or with explicit path:
```bash
C:\Users\meapu\AppData\Local\Programs\Python\Python312\python.exe bridge.py
```

### Accessing the Web Interface
Open your web browser and navigate to:
```text
http://localhost:8000
```
*(Or `http://127.0.0.1:8000`)*

---

## 5. Stopping the GCS

### Method 1: One-Click Windows Batch Script
Double-click:
```text
stop_bhoomigcs.bat
```
This script finds any process listening on port 8000 and terminates it cleanly.

### Method 2: Command Line
```powershell
# PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force

# CMD:
for /f "tokens=5" %a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %a
```

---

## 6. Serial Port & Connection Configuration

The backend `bridge.py` defaults to `AUTO` port detection:
- It checks `COM8` @ `115200` baud (USB Direct).
- It checks `COM5` @ `57600` baud (SiK Telemetry Radio).

### Manual Port Switching
You can switch the active telemetry port in real-time without restarting the server:
1. In the GCS web UI, navigate to **Settings** (`#device-settings`).
2. Select your desired port from the **Serial Port** dropdown (`COM8`, `COM5`, etc.).
3. Choose the appropriate baud rate (`57600` for radio, `115200` for USB).
4. Click **Connect / Switch**.

Alternatively, send an HTTP POST request:
```bash
curl -X POST http://localhost:8000/api/switch-port -H "Content-Type: application/json" -d "{\"port\": \"COM5\", \"baud\": 57600}"
```

---

## 7. Troubleshooting & FAQs

### Problem 1: `ModuleNotFoundError: No module named 'pymavlink'`
- **Cause**: Windows has multiple Python versions installed (e.g. Python 3.14 without packages and Python 3.12 with packages).
- **Solution**: Explicitly use Python 3.12:
  ```bash
  py -3.12 bridge.py
  ```

### Problem 2: `[Errno 10048] error while attempting to bind on address ('0.0.0.0', 8000)`
- **Cause**: A previous instance of `bridge.py` or another application is still occupying port 8000.
- **Solution**: Run `stop_bhoomigcs.bat` to release port 8000.

### Problem 3: `SerialException: could not open port 'COM5': PermissionError(13, 'Access is denied.')`
- **Cause**: Mission Planner, QGroundControl, or an open diagnostic terminal is currently holding the COM port.
- **Solution**: Disconnect Mission Planner / QGC and close any background Python diagnostic scripts.

### Problem 4: Browser Shows Old UI (Stale Cache)
- **Cause**: Chrome caches static JavaScript files aggressively.
- **Solution**:
  - Perform a hard refresh: `Ctrl + Shift + R` or `Ctrl + F5`.
  - Open Developer Tools (`F12`), right click the browser refresh icon, and select **"Empty Cache and Hard Reload"**.
