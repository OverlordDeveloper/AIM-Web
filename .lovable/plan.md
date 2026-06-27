## Add LED Lights toggle to Camera panel (Inspector / Home)

Add an on/off lightbulb control inside the existing Camera bottom panel on `src/pages/Index.tsx`, sending its state over the WebSocket alongside other camera updates.

### Changes

**`src/components/CameraSettingsDialog.tsx`**
- Extend `CameraSettings` with `lights: boolean`.
- Add a new compact control group at the start of the panel row: a clickable `Lightbulb` icon (lucide-react) acting as a toggle.
  - Off state: outlined bulb, muted color.
  - On state: filled/amber bulb (uses existing amber accent), subtle glow ring.
  - Label underneath: `LIGHTS · ON` / `LIGHTS · OFF` in the same `text-[10px] font-mono uppercase` style as siblings.
- Toggle calls `onUpdate("lights", !settings.lights)`.

**`src/pages/Index.tsx`**
- Add `lights: false` to `DEFAULT_CAMERA_SETTINGS`.
- No other logic changes — existing `handleCameraUpdate` already forwards any `CameraSettings` key via:
  ```
  sendJson({ type: "camera.update", path: "camera.lights", value: true|false })
  ```
- The existing `state.init` / `state.update` merge in the `useEffect` will pick up `camera.lights` from the backend automatically.

### Out of scope
- No backend code, no new WS message type.
- No changes to Defect/Anomaly/History/Analytics pages.
- Not added to the left Controls sidebar (lives only in the Camera panel, as requested).
