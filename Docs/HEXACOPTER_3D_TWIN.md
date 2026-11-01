# 🚁 3D Hexacopter Digital Twin & Calibration — BHOOMI DRISHTI

This document covers the **Three.js 3D Digital Twin** implementation (`js/views/orientation.js`), detailing procedural geometry, studio lighting, materials, and safe client-side visual display calibration.

---

## 1. Airframe Geometry: Hexacopter (X-Configuration)

The 3D model is constructed procedurally in Three.js without external `.obj` or `.gltf` asset files, providing instant rendering and zero network loading time.

### Hexagonal Fuselage & Arms
- **Central Core**: Hexagonal prism cylinder (`CylinderGeometry(0.95, 1.10, 0.28, 6)`), rotated 30° (`Math.PI / 6`) so vertices align with arm vectors.
- **Top Canopy**: Platinum survey canopy with SVAMITVA golden emblem and red GPS puck mast.
- **Nose / Sensor Pod**: Mounted along $-Z$ (Three.js forward vector) with stereoscopic dual vision lenses, micro-LiDAR module, and gold flight path arrow.
- **Gimbal Payload**: 3-axis stabilized Sony a7R full-frame survey camera with 35mm lens barrel and rubber dampening balls.

### Motor Layout & Rotations (ArduPilot Hexa-X Convention)

| Motor ID | Position | Arm Angle | Rotation | LED Nav Indicator |
| :--- | :--- | :--- | :--- | :--- |
| **M1** | Front-Right (FR) | $+30^\circ$ | **Counter-Clockwise (CCW)** | Green LED |
| **M5** | Mid-Right (MR) | $+90^\circ$ | **Clockwise (CW)** | Cyan LED |
| **M4** | Rear-Right (RR) | $+150^\circ$ | **Counter-Clockwise (CCW)** | Amber LED |
| **M6** | Rear-Left (RL) | $+210^\circ$ | **Clockwise (CW)** | Amber LED |
| **M2** | Mid-Left (ML) | $+270^\circ$ | **Counter-Clockwise (CCW)** | Cyan LED |
| **M3** | Front-Left (FL) | $+330^\circ$ | **Clockwise (CW)** | Red LED |

Propellers rotate continuously during the animation loop based on flight status (low RPM when disarmed, high RPM when armed).

---

## 2. Materials & High-Visibility Studio Lighting

### PBR Material Architecture
To prevent 3D models from appearing dark or black against a dark sky background:
- **Fuselage Shell**: `roughness: 0.38, metalness: 0.08` (Diffuse matte white).
- **Canopy**: `roughness: 0.22, metalness: 0.12` (Platinum satin finish).
- **Carbon Arms**: `roughness: 0.40, metalness: 0.10` (Matte carbon graphite).
- **Motor Bells**: `roughness: 0.18, metalness: 0.92` (Anodized gold).

### Multi-Point Studio Rig
- **Zenith Overhead**: `THREE.DirectionalLight(0xffffff, 2.5)` at `(0, 12, 0)` illuminating upper deck.
- **Sun Key Light**: `THREE.DirectionalLight(0xffffff, 2.2)` at `(4, 12, 7)`.
- **Soft Ambient Fill**: `THREE.HemisphereLight(0xffffff, 0x1e293b, 1.4)`.
- **Underbelly Uplight**: `THREE.DirectionalLight(0x93c5fd, 1.2)` at `(0, -6, 2)`.
- **Tone Mapping**: ACES Filmic Tone Mapping (`renderer.toneMappingExposure = 1.60`).
- **`💡 BOOST LIGHT` Mode**: Quick toggle cycling exposure from Studio (1.45) $\to$ Vivid (1.85) $\to$ Daylight (1.25).

---

## 3. Safe Client-Side Visual Calibration

> [!IMPORTANT]
> **SAFETY GUARANTEE: Zero Flight Controller Parameter Writes**  
> BHOOMI DRISHTI never sends `MAV_CMD_PREFLIGHT_CALIBRATION` or `PARAM_SET` commands to the Pixhawk. All calibration, axis inversions, and offsets are **strictly client-side display corrections** stored in browser `localStorage`.

### Mathematical Transformation Pipeline
When an `ATTITUDE` packet arrives with raw `(pitch, roll, yaw)`:

```
Raw MAVLink ATTITUDE (pitch, roll, yaw in radians)
                      |
                      v
1. Offset & Trim Compensation:
   p0 = rawPitch - (pitchOffset + pitchTrim)
   r0 = rawRoll  - (rollOffset  + rollTrim)
   y0 = rawYaw   - yawOffset
                      |
                      v
2. Flight Controller Mounting Rotation Remap (0°, 90°, 180°, 270°):
   rot = 90°  --> p_r = -r0,  r_r = p0
   rot = 180° --> p_r = -p0,  r_r = -r0
   rot = 270° --> p_r =  r0,  r_r = -p0
                      |
                      v
3. Pitch <--> Roll Swap (if enabled in UI):
   p_s = swapAxes ? r_r : p_r
   r_s = swapAxes ? p_r : r_r
                      |
                      v
4. Axis Sign Inversions & Three.js Aerospace Euler Mapping:
   droneGroup.rotation.order = 'YXZ'
   droneGroup.rotation.x =  p_s * (invertPitch ? -1 : 1)
   droneGroup.rotation.z =  r_s * (invertRoll  ? -1 : 1)
   droneGroup.rotation.y = -y0  * (invertYaw   ? -1 : 1)
```

---

## 4. Mission Planner-Style 6-Axis Alignment Wizard

The built-in calibration wizard (`window.startAhrsWizard()`) guides the operator through 6 physical drone positions to verify orientation:

1. **LEVEL (Table rest)**: Calibrates baseline horizon zero ($p_{\text{level}}, r_{\text{level}}$).
2. **NOSE UP (+70° Tilt)**: Checks pitch direction; inverts pitch if model tilts backward.
3. **NOSE DOWN (-70° Tilt)**: Verifies pitch symmetry.
4. **LEFT SIDE (80° Bank)**: Verifies roll bank axis.
5. **RIGHT SIDE (80° Bank)**: Checks roll direction; inverts roll if model banks incorrectly.
6. **BACK (Upside down 180°)**: Verifies inverted flight stability.

Once completed, the calculated configuration is saved instantly to `localStorage` under `bhoomi_ahrs_calibration_v2` and applied across all views.
