/**
 * Bhoomi Drishti Ground Control Station (GCS v2.4-RC3)
 * Core Application Engine, WebSocket MAVLink Link, Dynamic COM Port Switcher
 */

// Global GCS State
window.bhoomiState = {
  connected: false,
  hardwareConnected: false,
  comPort: 'COM5',
  targetPort: 'AUTO',
  baudRate: 57600,
  connectionType: 'SEARCHING',
  armed: false,
  flightMode: 'STANDBY',
  altitudeAGL: 0.0,
  altitudeMSL: 0.0,
  groundSpeed: 0.0,
  airSpeed: 0.0,
  climbRate: 0.0,
  throttle: 0,
  heading: 0,
  pitch: 0.0,
  roll: 0.0,
  yaw: 0.0,
  batteryVoltage: 0.0,
  batteryCurrent: 0.0,
  batteryPercent: 100,
  satellites: 0,
  gpsFix: 'SEARCHING...',
  hdop: 1.0,
  vdop: 1.0,
  rssi: 94,
  rfDbm: -68,
  imuTemp: 38.6,
  cpuLoad: 35.0,
  vibrationX: 0.02,
  vibrationY: 0.02,
  vibrationZ: 0.03,
  ekf: {
    velocity_variance: 0.04,
    pos_horiz_variance: 0.02,
    pos_vert_variance: 0.03,
    compass_variance: 0.01,
    terrain_alt_variance: 0.0
  },
  rcChannels: [1500] * 16,
  activeWaypoint: 1,
  totalWaypoints: 24,
  surveyAreaTotalHa: 28.5,
  surveyAreaDoneHa: 0.0,
  surveyPhotosCount: 0,
  sdFreeGb: 184,
  simulationRunning: false,
  audioMuted: false,
  activeView: 'live-orientation',
  droneLat: 28.73266,
  droneLng: 77.11903,
  packetsReceived: 0,
  availablePorts: []
};

// Audio Alert System
window.bhoomiAudio = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  },
  beep(freq = 880, duration = 0.15, type = 'sine') {
    if (window.bhoomiState.audioMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  },
  alertWarning() {
    this.beep(520, 0.1, 'square');
    setTimeout(() => this.beep(440, 0.2, 'square'), 120);
  },
  alertSuccess() {
    this.beep(880, 0.1, 'sine');
    setTimeout(() => this.beep(1320, 0.2, 'sine'), 100);
  }
};

// Notification Toast
window.showNotification = function(msg, isError = false) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = msg;
  if (isError) {
    toast.classList.remove('text-primary');
    toast.classList.add('text-error');
    window.bhoomiAudio.alertWarning();
  } else {
    toast.classList.remove('text-error');
    toast.classList.add('text-primary');
  }

  toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-3');
  toast.classList.add('opacity-100', 'translate-y-0');

  if (window._toastTimer) clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-y-0');
    toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-3');
  }, 3200);
};

// Clean View Router & Tab Switching
window.navigateTo = function(viewId) {
  window.bhoomiState.activeView = viewId;
  window.location.hash = viewId;

  document.querySelectorAll('#sidebar-nav .nav-link').forEach(link => {
    const path = link.getAttribute('data-path');
    if (path === viewId) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active', 'bg-primary-container', 'text-on-primary-container', 'font-semibold');
      link.removeAttribute('aria-current');
    }
  });

  document.querySelectorAll('.view-section').forEach(sec => {
    if (sec.id === `view-${viewId}`) {
      sec.classList.remove('hidden');
    } else {
      sec.classList.add('hidden');
    }
  });

  if (viewId === 'live-orientation' && window.initOrientation3D) {
    window.initOrientation3D();
  }
  if (viewId === 'drone-telemetry' && window.initTelemetryCharts) {
    window.initTelemetryCharts();
  }
  if (viewId === 'flight-controller-health' && window.initFCHealth) {
    window.initFCHealth();
  }
  if (viewId === 'land-mapping-workspace') {
    if (window.initCadastreMap) window.initCadastreMap();
    setTimeout(() => {
      if (window.cadastreMap) window.cadastreMap.invalidateSize();
    }, 150);
  }
  if (viewId === 'overview') {
    if (window.initOverviewMiniMap) window.initOverviewMiniMap();
    setTimeout(() => {
      if (window.overviewMiniMap) window.overviewMiniMap.invalidateSize();
    }, 150);
  }

  window.showNotification(`Active Console: ${viewId.replace(/-/g, ' ').toUpperCase()}`);
};

// Switch Active MAVLink Port (COM5 Telemetry @ 57600 or COM8 USB @ 115200)
window.switchMavlinkPort = async function(port, baud) {
  baud = parseInt(baud) || (port === 'COM5' ? 57600 : 115200);
  window.showNotification(`Switching MAVLink to ${port} @ ${baud} baud...`);

  try {
    const res = await fetch('/api/switch-port', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ port: port, baud: baud })
    });
    const data = await res.json();
    window.bhoomiState.targetPort = port;
    window.bhoomiState.baudRate = baud;
    window.showNotification(data.message || `Switched to ${port}`);
    updateHardwareBadge(false, `Connecting to ${port}...`);
  } catch (err) {
    console.error("Port switch error:", err);
    window.showNotification("Error switching COM port", true);
  }
};

// Fetch list of physical COM ports
async function refreshAvailablePorts() {
  try {
    const res = await fetch('/api/ports');
    const data = await res.json();
    window.bhoomiState.availablePorts = data.ports || [];
    renderPortSwitcher(data.ports, data.current_active, data.target_port);
  } catch (e) {
    // Backend offline / static preview mode
  }
}

function renderPortSwitcher(ports, activePort, targetPort) {
  const headerSelect = document.getElementById('hdr-port-selector');
  if (!headerSelect) return;
  if (headerSelect.options.length <= 1) {
    headerSelect.innerHTML = `
      <option value="AUTO">⚡ Auto-Detect Port</option>
      <option value="COM8">🔌 COM8 - Pixhawk USB (115200 baud)</option>
      <option value="COM5">📻 COM5 - Telemetry Radio (57600 baud)</option>
    `;
  }
  const desired = targetPort || activePort || 'AUTO';
  if (headerSelect.value !== desired && !headerSelect.matches(':focus')) {
    headerSelect.value = desired;
  }
}

// WebSocket Real-time MAVLink Link
let ws = null;
function initWebSocket() {
  const wsUrl = `ws://${window.location.hostname || 'localhost'}:8000/ws`;
  console.log(`[Bhoomi Drishti] Connecting to MAVLink WebSocket: ${wsUrl}`);

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[Bhoomi Drishti] MAVLink WebSocket Connected!");
      window.bhoomiState.hardwareConnected = true;
      refreshAvailablePorts();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        applyMavlinkData(data);
      } catch (e) {
        console.error("Error parsing telemetry packet:", e);
      }
    };

    ws.onclose = () => {
      window.bhoomiState.hardwareConnected = false;
      updateHardwareBadge(false, "MAVLINK OFFLINE (RECONNECTING)");
      setTimeout(initWebSocket, 2000);
    };

    ws.onerror = (err) => {
      ws.close();
    };
  } catch (e) {
    setTimeout(initWebSocket, 3000);
  }
}

function applyMavlinkData(data) {
  const s = window.bhoomiState;
  s.connected = data.connected;
  s.comPort = data.port || 'COM5';
  s.baudRate = data.baud || 57600;
  s.connectionType = data.connection_type || 'SEARCHING';
  s.targetPort = data.target_port || 'AUTO';
  s.armed = data.armed;
  s.flightMode = data.flight_mode || 'STANDBY';
  s.pitch = data.pitch;
  s.roll = data.roll;
  s.yaw = data.yaw;
  s.heading = data.heading;
  s.altitudeAGL = data.alt_agl > 0 ? data.alt_agl : data.alt_msl;
  s.altitudeMSL = data.alt_msl;
  s.groundSpeed = data.groundspeed;
  s.airSpeed = data.airspeed;
  s.climbRate = data.climb_rate;
  s.throttle = data.throttle;
  s.satellites = data.satellites_visible !== undefined ? data.satellites_visible : 0;
  
  const FIX_MAP = {
    0: 'NO GPS',
    1: 'NO FIX',
    2: '2D FIX',
    3: '3D FIX',
    4: 'DGPS FIX',
    5: 'RTK FLOAT',
    6: 'RTK FIXED'
  };
  s.gpsFixType = data.gps_fix_type !== undefined ? data.gps_fix_type : 0;
  s.gpsFix = FIX_MAP[data.gps_fix_type] || (s.satellites >= 4 ? '3D FIX' : 'SEARCHING');
  s.hdop = data.hdop !== undefined ? data.hdop : 0.0;
  s.vdop = data.vdop !== undefined ? data.vdop : 0.0;
  s.cpuLoad = data.cpu_load;
  s.vibrationX = data.vibration_x;
  s.vibrationY = data.vibration_y;
  s.vibrationZ = data.vibration_z;

  if (data.voltage_battery > 0) {
    s.batteryVoltage = data.voltage_battery;
    s.batteryCurrent = data.current_battery;
    s.batteryPercent = data.battery_remaining >= 0 ? data.battery_remaining : 88;
  }

  if (data.imu_temp) {
    s.imuTemp = data.imu_temp;
  }
  if (data.rssi !== undefined) {
    s.rssi = data.rssi;
  }
  if (data.rf_dbm !== undefined) {
    s.rfDbm = data.rf_dbm;
  }

  s.ekf = {
    velocity_variance: data.velocity_variance,
    pos_horiz_variance: data.pos_horiz_variance,
    pos_vert_variance: data.pos_vert_variance,
    compass_variance: data.compass_variance,
    terrain_alt_variance: data.terrain_alt_variance
  };

  if (data.rc_channels && data.rc_channels.length > 0) {
    s.rcChannels = data.rc_channels;
  }

  if (data.lat && data.lon && (data.lat !== 0 || data.lon !== 0)) {
    s.droneLat = data.lat;
    s.droneLng = data.lon;
    if (window.droneMapMarker) {
      window.droneMapMarker.setLatLng([data.lat, data.lon]);
    }
    if (window.overviewDroneMarker) {
      window.overviewDroneMarker.setLatLng([data.lat, data.lon]);
    }
  }

  // Always invoke map location & HUD update so satellites and HDOP are displayed live
  if (window.updateMapDroneLocation) {
    window.updateMapDroneLocation(s.droneLat, s.droneLng, s);
  }

  s.packetsReceived = data.packets_received;

  updateHardwareBadge(data.connected, data.status_message);
  updateCommonTelemetryDisplays();

  if (window.onTelemetryTick) {
    window.onTelemetryTick(s);
  }
}

function formatHDOP(hdop) {
  if (hdop === undefined || hdop === null || hdop <= 0 || hdop >= 90) {
    return '--';
  }
  return Number(hdop).toFixed(2);
}

function updateHardwareBadge(isConnected, customMsg) {
  const badge = document.getElementById('hardware-connection-badge');
  if (!badge) return;

  const isRadio = window.bhoomiState.comPort === 'COM5';

  if (isConnected) {
    badge.innerHTML = `
      <span class="relative flex h-2 w-2">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
      </span>
      <span class="font-label-caps text-label-caps text-secondary font-bold">
        ${isRadio ? '📻 TELEMETRY RADIO' : '🔌 USB DIRECT'} (${window.bhoomiState.comPort} @ ${window.bhoomiState.baudRate})
      </span>
    `;
    badge.className = "flex items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container-low border border-secondary/30";
  } else {
    badge.innerHTML = `
      <span class="relative flex h-2 w-2 rounded-full bg-error"></span>
      <span class="font-label-caps text-label-caps text-error font-bold">
        ${customMsg || `SEARCHING (${window.bhoomiState.comPort} @ ${window.bhoomiState.baudRate})`}
      </span>
    `;
    badge.className = "flex items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container-low border border-error/30";
  }
}

function updateCommonTelemetryDisplays() {
  const s = window.bhoomiState;
  const hdopStr = formatHDOP(s.hdop);

  // 1. Top Header Satellites & HDOP Pill (Visible across ALL pages)
  const hdrSats = document.getElementById('hdr-sats-count');
  if (hdrSats) hdrSats.textContent = `${s.satellites} SATS`;

  const hdrHdop = document.getElementById('hdr-hdop-val');
  if (hdrHdop) hdrHdop.textContent = `HDOP: ${hdopStr}`;

  const hdrFix = document.getElementById('hdr-gps-fix-badge');
  if (hdrFix) {
    hdrFix.textContent = s.gpsFix;
    if (s.gpsFixType >= 3) {
      hdrFix.className = "font-label-caps text-[9px] px-1.5 py-0.5 rounded bg-secondary/20 text-secondary font-bold ml-0.5";
    } else {
      hdrFix.className = "font-label-caps text-[9px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-bold ml-0.5";
    }
  }

  // 2. View 01: Overview FPV Cockpit HUD & Mini-map
  const hudSats = document.getElementById('hud-gps-sats');
  if (hudSats) hudSats.textContent = `${s.satellites} SATS (${s.gpsFix})`;
  const hudHdop = document.getElementById('hud-gps-hdop');
  if (hudHdop) hudHdop.textContent = `HDOP: ${hdopStr}`;
  const ovMiniSats = document.getElementById('ov-mini-sats');
  if (ovMiniSats) ovMiniSats.textContent = `${s.satellites} SATS (${s.gpsFix}) | HDOP: ${hdopStr}`;

  // 3. View 02: Telemetry & Sensors Header
  const satEl = document.getElementById('telem-rtk-sats');
  if (satEl) satEl.textContent = `${s.satellites} SATS (${s.gpsFix})`;
  const telemHdop = document.getElementById('telem-hdop-val');
  if (telemHdop) telemHdop.textContent = `HDOP: ${hdopStr}`;

  // 4. View 04: AHRS 3D Live Orientation Header
  const ahrsSats = document.getElementById('ahrs-sats-val');
  if (ahrsSats) ahrsSats.textContent = `${s.satellites}`;
  const ahrsHdop = document.getElementById('ahrs-hdop-val');
  if (ahrsHdop) ahrsHdop.textContent = hdopStr;

  // 5. View 05: Land Mapping Workspace Header
  const mapSats = document.getElementById('map-sats-count');
  if (mapSats) mapSats.textContent = `${s.satellites} SATS`;
  const mapHdop = document.getElementById('map-hdop-readout');
  if (mapHdop) mapHdop.textContent = `HDOP: ${hdopStr}`;
  const mapFix = document.getElementById('map-live-gps-fix');
  if (mapFix) mapFix.textContent = s.gpsFix;

  const imuTempEl = document.getElementById('imu-temp');
  if (imuTempEl) imuTempEl.textContent = `${s.imuTemp}°C`;

  const busVoltEl = document.getElementById('bus-volt');
  if (busVoltEl) {
    busVoltEl.textContent = s.batteryVoltage > 0 ? `${s.batteryVoltage}V (${s.batteryPercent}%)` : `USB / 5.0V`;
  }

  const modeBadge = document.getElementById('hdr-flight-mode-badge');
  if (modeBadge) {
    modeBadge.textContent = s.flightMode;
  }
}

// Global DOM Ready Initialization
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#sidebar-nav .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const path = link.getAttribute('data-path');
      if (path) window.navigateTo(path);
    });
  });

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash && hash !== window.bhoomiState.activeView) {
      window.navigateTo(hash);
    }
  });

  // Setup Header Port Switcher
  const portSelect = document.getElementById('hdr-port-selector');
  if (portSelect) {
    portSelect.addEventListener('change', (e) => {
      const selected = e.target.value;
      const baud = selected === 'COM5' ? 57600 : 115200;
      window.switchMavlinkPort(selected, baud);
    });
  }

  // Setup Device Settings (Console 08) tab switching to sync with backend
  document.querySelectorAll('.conn-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const text = tab.textContent.toUpperCase();
      if (text.includes('TELEMETRY')) {
        window.switchMavlinkPort('COM5', 57600);
      } else if (text.includes('USB')) {
        window.switchMavlinkPort('COM8', 115200);
      }
    });
  });

  const initialHash = window.location.hash.replace('#', '') || 'live-orientation';
  window.navigateTo(initialHash);

  initWebSocket();
  setInterval(refreshAvailablePorts, 5000);
});
