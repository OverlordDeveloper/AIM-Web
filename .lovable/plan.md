## Defect Detection page

A new page (route `/defect-detection`, label "Defect Detection") for running a detection model on images and visualizing labeled bounding-box detections. Existing pages stay untouched.

### Layout

Reuses the same shell as Anomaly Detection:

```text
+----------------------------------------------------------+
| TopNav (Inspector | Anomaly | Defect Detection | ...)    |
+--------------------+-------------------------------------+
| Sidebar (~22%)     | Main viewer                         |
|                    |                                     |
|  Model picker      |  +-------------------------------+  |
|  (dropdown)        |  |                               |  |
|                    |  |   Image + detection boxes     |  |
|  Categories list   |  |   (labels + confidence)       |  |
|   [x] class A      |  |                               |  |
|       slider 0.50  |  +-------------------------------+  |
|   [x] class B      |                                     |
|       slider 0.30  |  Live history strip (latest first)  |
|   ...              |  [thumb][thumb][thumb][thumb]...    |
|                    |                                     |
|  Global toggles    |                                     |
|   - Detect on/off  |                                     |
|   - Auto-scroll    |                                     |
+--------------------+-------------------------------------+
```

### Sidebar

- **Model selector** -- a `Select` dropdown listing available detection models. Selecting a model loads its class list (mocked locally for now, structured so the real fetch can drop in later).
- **Categories panel** -- one row per class with:
  - Checkbox to enable/disable the class
  - Confidence threshold slider (0.00 - 1.00, step 0.01) shown next to the class name with a numeric readout
  - Small color swatch matching the box color used in the viewer
- **Global controls** -- Detect enabled toggle, Auto-scroll toggle for the history.

### Main viewer

- **Detection canvas** -- an `ImagePanel`-style square area showing the current frame with bounding boxes drawn as absolutely-positioned divs over the image (each with class label + confidence). Boxes respect the per-class enabled state and threshold.
- **Live history** -- horizontal scrollable strip of the most recent N (e.g. 30) frames. Clicking a thumb selects it as the main view. Newest items appear on the left; auto-scroll keeps the latest selected.

### Mock data

A small in-file mock generator produces a synthetic stream:
- 2 example models (e.g. "Surface defects v1", "Packaging v2") each with their own class list (4-6 classes, distinct colors).
- A `setInterval` pushes a new mock frame every ~1.5s containing 0-5 random detections (random box, random class, random confidence). Image source is a placeholder (e.g. `/placeholder.svg` or a solid-color canvas) so we don't need real frames yet.
- All mock logic lives in one module so it can be swapped for a real WS feed later without touching the UI.

### Files to create / modify

- `src/pages/DefectDetection.tsx` -- new page, mirrors AnomalyDetection's shell.
- `src/components/defect/DefectSidebar.tsx` -- model picker + class list with thresholds + global toggles.
- `src/components/defect/DefectViewer.tsx` -- image + overlaid bounding boxes.
- `src/components/defect/DefectHistory.tsx` -- horizontal thumbnail strip.
- `src/lib/defectMock.ts` -- mock models, classes, and frame generator (typed so a real backend can replace it).
- `src/App.tsx` -- add `/defect-detection` route.
- `src/components/TopNav.tsx` -- add a "Defect Detection" link with a `ScanSearch` (or similar) lucide icon, placed between Anomaly Detection and History.

### Technical notes

- Types: `DetectionModel { id, name, classes: DetectionClass[] }`, `DetectionClass { id, name, color }`, `DetectionBox { classId, confidence, x, y, w, h }` (normalized 0-1), `DetectionFrame { id, timestamp, imageUrl, boxes }`.
- Per-class state kept in a `Record<string, { enabled: boolean; threshold: number }>` keyed by class id, reset whenever the selected model changes.
- Reuses existing shadcn primitives (`Select`, `Slider`, `Checkbox`, `ScrollArea`, `Separator`) and design tokens; no custom colors in components beyond the per-class swatches stored on the mock data.
- No backend, no WebSocket changes, no edits to other pages or the existing Anomaly/History/Analytics flows.
