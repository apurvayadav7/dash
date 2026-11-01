/**
 * View 01: Mission Overview & Pilot Cockpit HUD
 * Real FPV 5.8GHz USB Video Receiver (UVC WebCam) + Primary Flight Display
 */

let overviewMiniMap = null;
let overviewDroneMarker = null;
let fpvMediaStream = null;
let ovSatTiles = null;
let ovOsmTiles = null;

window.initOverviewMiniMap = function() {
  const container = document.getElementById('overview-mini-map');
  if (!container) return;

  if (overviewMiniMap) {
    overviewMiniMap.invalidateSize();
    return;
  }

  overviewMiniMap = L.map('overview-mini-map', {
    zoomControl: false,
    attributionControl: true
  }).setView([28.73266, 77.11903], 16);
  window.overviewMiniMap = overviewMiniMap;

  // OpenStreetMap Tile Layer
  ovOsmTiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
  });

  // Satellite Ortho Tile Layer
  ovSatTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}', {
    maxZoom: 19,
    attribution: 'Esri'
  });

  // Default to OpenStreetMap
  ovOsmTiles.addTo(overviewMiniMap);

  // Basemap switcher for cockpit overview mini-map
  window.switchOverviewBaseMap = function(type) {
    if (!overviewMiniMap) return;
    const satBtn = document.getElementById('ov-map-sat-btn');
    const osmBtn = document.getElementById('ov-map-osm-btn');

    if (type === 'sat') {
      if (overviewMiniMap.hasLayer(ovOsmTiles)) overviewMiniMap.removeLayer(ovOsmTiles);
      ovSatTiles.addTo(overviewMiniMap);
      if (satBtn) {
        satBtn.className = "px-2 py-0.5 rounded text-[10px] font-label-caps bg-primary text-on-primary font-bold shadow cursor-pointer";
      }
      if (osmBtn) {
        osmBtn.className = "px-2 py-0.5 rounded text-[10px] font-label-caps text-on-surface-variant hover:text-on-surface cursor-pointer";
      }
      window.showNotification("Cockpit Mini-Map: Satellite Ortho Layer");
    } else {
      if (overviewMiniMap.hasLayer(ovSatTiles)) overviewMiniMap.removeLayer(ovSatTiles);
      ovOsmTiles.addTo(overviewMiniMap);
      if (osmBtn) {
        osmBtn.className = "px-2 py-0.5 rounded text-[10px] font-label-caps bg-primary text-on-primary font-bold shadow cursor-pointer";
      }
      if (satBtn) {
        satBtn.className = "px-2 py-0.5 rounded text-[10px] font-label-caps text-on-surface-variant hover:text-on-surface cursor-pointer";
      }
      window.showNotification("Cockpit Mini-Map: OpenStreetMap Standard");
    }
  };

  // Cadastral polygon boundary preview (SSCBS Campus, Sector 16 Rohini)
  L.polygon([
    [28.7315, 77.1176],
    [28.7338, 77.1176],
    [28.7338, 77.1206],
    [28.7315, 77.1206]
  ], {
    color: '#06b6d4',
    fillColor: '#06b6d4',
    fillOpacity: 0.25,
    weight: 2
  }).addTo(overviewMiniMap);

  const icon = L.divIcon({
    className: 'ov-drone-icon',
    html: `
      <div class="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-[0_0_8px_rgba(76,215,246,0.8)]">
        <span class="material-symbols-outlined text-xs text-on-primary">navigation</span>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  overviewDroneMarker = L.marker([28.73266, 77.11903], { icon }).addTo(overviewMiniMap);
  window.overviewDroneMarker = overviewDroneMarker;

  if (window.updateCameraDeviceList) {
    window.updateCameraDeviceList();
  }
};

// Live WebCam & FPV 5.8GHz Video Receiver Integration
window.toggleRealFPVFeed = async function() {
  const videoEl = document.getElementById('fpv-live-video');
  const imgEl = document.getElementById('fpv-static-img');
  const btn = document.getElementById('btn-fpv-feed');
  const streamBadge = document.getElementById('fpv-stream-badge');
  const cameraSelect = document.getElementById('fpv-camera-select');

  if (fpvMediaStream) {
    // Stop live stream
    fpvMediaStream.getTracks().forEach(t => t.stop());
    fpvMediaStream = null;
    if (videoEl) {
      videoEl.srcObject = null;
      videoEl.classList.add('hidden');
    }
    if (imgEl) imgEl.classList.remove('hidden');
    if (btn) {
      btn.innerHTML = `<span class="material-symbols-outlined text-xs">videocam</span> START WEBCAM FEED`;
      btn.className = "px-2.5 py-1 rounded bg-secondary text-on-secondary font-label-caps text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow hover:brightness-110 active:scale-95 transition-all";
    }
    if (streamBadge) {
      streamBadge.textContent = "STANDBY";
      streamBadge.className = "font-label-caps text-[9px] px-1.5 py-0.5 rounded bg-surface-container text-outline font-bold";
    }
    window.showNotification("Webcam video feed disconnected");
    return;
  }

  try {
    window.showNotification("Accessing video webcam feed...");

    // Enumerate connected video devices
    await window.updateCameraDeviceList();

    const selectedDeviceId = (cameraSelect && cameraSelect.value && cameraSelect.value !== 'default') 
      ? cameraSelect.value 
      : undefined;

    const constraints = {
      video: selectedDeviceId 
        ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
        : { width: { ideal: 1920 }, height: { ideal: 1080 } },
      audio: false
    };

    fpvMediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    if (videoEl) {
      videoEl.srcObject = fpvMediaStream;
      videoEl.classList.remove('hidden');
      videoEl.play().catch(e => console.warn("Video play error:", e));
    }
    if (imgEl) imgEl.classList.add('hidden');
    if (btn) {
      btn.innerHTML = `<span class="material-symbols-outlined text-xs">videocam_off</span> STOP FEED`;
      btn.className = "px-2.5 py-1 rounded bg-error-container text-on-error-container font-label-caps text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow hover:brightness-110 active:scale-95 transition-all";
    }
    if (streamBadge) {
      streamBadge.textContent = "LIVE WEBCAM FEED";
      streamBadge.className = "font-label-caps text-[9px] px-1.5 py-0.5 rounded bg-secondary/20 text-secondary font-bold";
    }

    // Refresh device list with permissions granted to show real camera names
    await window.updateCameraDeviceList();

    window.showNotification("WebCam connected live to FPV Cockpit HUD!");
  } catch (err) {
    console.error("Camera access error:", err);
    window.showNotification("Could not access camera. Please allow camera permissions in your browser.", true);
  }
};

window.switchCameraDevice = async function(deviceId) {
  if (!fpvMediaStream) {
    window.toggleRealFPVFeed();
    return;
  }

  // Stop current stream
  fpvMediaStream.getTracks().forEach(t => t.stop());
  fpvMediaStream = null;

  const videoEl = document.getElementById('fpv-live-video');
  const constraints = {
    video: (deviceId && deviceId !== 'default') 
      ? { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
      : { width: { ideal: 1920 }, height: { ideal: 1080 } },
    audio: false
  };

  try {
    fpvMediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    if (videoEl) {
      videoEl.srcObject = fpvMediaStream;
      videoEl.play().catch(e => console.warn(e));
    }
    window.showNotification("Switched active video camera source");
  } catch (err) {
    console.error("Camera switch error:", err);
    window.showNotification("Could not switch to selected video device", true);
  }
};

window.toggleCameraMirror = function() {
  const videoEl = document.getElementById('fpv-live-video');
  if (!videoEl) return;
  videoEl.classList.toggle('scale-x-[-1]');
  window.showNotification("Webcam horizontal mirror toggled");
};

window.updateCameraDeviceList = async function() {
  const select = document.getElementById('fpv-camera-select');
  if (!select || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');

    const currentVal = select.value;
    select.innerHTML = '';

    const defaultOpt = document.createElement('option');
    defaultOpt.value = 'default';
    defaultOpt.textContent = '📷 Primary WebCam';
    select.appendChild(defaultOpt);

    videoDevices.forEach((dev, idx) => {
      const opt = document.createElement('option');
      opt.value = dev.deviceId;
      opt.textContent = `📷 ${dev.label || `Camera ${idx + 1}`}`;
      select.appendChild(opt);
    });

    if (currentVal && select.querySelector(`option[value="${currentVal}"]`)) {
      select.value = currentVal;
    }
  } catch (e) {
    console.warn("enumerateDevices error", e);
  }
};

window.toggleArming = function() {
  window.bhoomiState.armed = !window.bhoomiState.armed;
  const armBtn = document.getElementById('btn-action-arm');
  const badge = document.getElementById('hud-arm-badge');

  if (window.bhoomiState.armed) {
    if (armBtn) {
      armBtn.classList.remove('bg-error-container', 'text-on-error-container');
      armBtn.classList.add('bg-secondary', 'text-on-secondary');
      armBtn.innerHTML = `<span class="material-symbols-outlined text-xs">gpp_good</span> ARMED (DISARM)`;
    }
    if (badge) {
      badge.textContent = "ARMED";
      badge.className = "font-label-caps text-label-caps px-space-xs py-0.5 rounded bg-secondary-container/30 text-secondary font-bold";
    }
    window.showNotification("AUTOPILOT ARMED! Motors active.");
  } else {
    if (armBtn) {
      armBtn.classList.remove('bg-secondary', 'text-on-secondary');
      armBtn.classList.add('bg-error-container', 'text-on-error-container');
      armBtn.innerHTML = `<span class="material-symbols-outlined text-xs">lock</span> DISARMED (ARM)`;
    }
    if (badge) {
      badge.textContent = "DISARMED";
      badge.className = "font-label-caps text-label-caps px-space-xs py-0.5 rounded bg-error-container/30 text-error font-bold";
    }
    window.showNotification("AUTOPILOT DISARMED. Motors disabled.");
  }
};

window.triggerTakeoff = function() {
  if (!window.bhoomiState.armed) {
    window.showNotification("Cannot Takeoff: Autopilot is DISARMED! Please Arm first.", true);
    return;
  }
  window.showNotification("TAKEOFF INITIATED: Climbing to survey altitude 80.0m AGL...");
  window.bhoomiState.altitudeAGL = 80.0;
  window.bhoomiState.flightMode = 'GUIDED CLIMB';
};

window.triggerRTL = function() {
  window.bhoomiState.flightMode = 'RTL';
  window.showNotification("RTL ENGAGED: Drone returning to launch home.");
};

window.triggerEmergencyLand = function() {
  window.bhoomiState.flightMode = 'LAND';
  window.showNotification("EMERGENCY LAND: Descending at current location!", true);
};

window.capturePayloadPhoto = function() {
  window.bhoomiState.surveyPhotosCount++;
  const countEl = document.getElementById('ov-photo-counter');
  if (countEl) countEl.textContent = window.bhoomiState.surveyPhotosCount;
  
  const shutterFlash = document.getElementById('fpv-shutter-flash');
  if (shutterFlash) {
    shutterFlash.classList.remove('opacity-0');
    shutterFlash.classList.add('opacity-80');
    setTimeout(() => {
      shutterFlash.classList.remove('opacity-80');
      shutterFlash.classList.add('opacity-0');
    }, 150);
  }
  window.bhoomiAudio.beep(1600, 0.08, 'triangle');
  window.showNotification(`Geotagged Cadastral Orthophoto #${window.bhoomiState.surveyPhotosCount} captured`);
};
