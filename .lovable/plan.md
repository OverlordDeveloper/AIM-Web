

## Move Camera Settings into the Controls Sidebar

### What changes
The camera settings currently live in a horizontal bottom panel (`CameraSettingsPanel`). We will move them into the left Controls sidebar as a new `ProcessingCard`-style card called "Camera", placed at the bottom of the card list. The bottom panel will be removed entirely.

### Plan

1. **Add a Camera card to the Controls sidebar** (`src/pages/Index.tsx`)
   - Add a new `ProcessingCard` (always visible, no enable/disable toggle -- or use a `Collapsible` section like the existing Settings subsection) at the bottom of the sidebar's card list
   - Include all camera controls stacked vertically (they fit better in a narrow sidebar than the current horizontal layout):
     - Resolution preset dropdown + custom W/H inputs
     - Auto Exposure and Auto WB checkboxes
     - Exposure, Analogue Gain, Brightness, Contrast sliders (using `InspectionSlider`)

2. **Remove the bottom CameraSettingsPanel** (`src/pages/Index.tsx`)
   - Remove the `<CameraSettingsPanel>` component from the `<main>` area
   - Remove the import of `CameraSettingsDialog`

3. **Keep `CameraSettingsDialog.tsx`** for now (or delete it) -- the logic will be inlined into `Index.tsx` using existing components (`Select`, `InspectionSlider`, `Checkbox`) that are already used in the sidebar.

### Technical details
- The camera card will use a `Collapsible` wrapper so users can expand/collapse camera settings independently
- Resolution dropdown uses `Select` component already imported
- Custom resolution inputs use `Input` component already imported
- All sliders reuse `InspectionSlider` with the same min/max/step values from the current bottom panel
- The `handleCameraUpdate` function and `cameraSettings` state remain unchanged
- The card will not participate in the mutual exclusion logic (camera settings are always available regardless of active mode)

