## Goal

Redesign the left "Defect Detection Settings" panel to feel industrial-grade:
1. Replace the simple "Detect" checkbox with two prominent, icon-driven action toggles: **Enable Detection** and **Enable Reject**.
2. Restyle the **Categories** list (per-class enable + threshold slider) so it reads like control-room equipment instead of a generic form.

Scope is purely visual/UX in `src/components/defect/DefectSidebar.tsx` plus a new `rejectEnabled` state passed in from `src/pages/DefectDetection.tsx`. No detection logic or mock-data changes.

---

## 1. Action toggles (Detection + Reject)

Replace the current `Detect` checkbox + `Auto-scroll` row with a dedicated **Controls** block above the model selector, containing two equally weighted toggle buttons side-by-side.

```text
┌──────────────────────────────────────────┐
│ CONTROLS                                 │
│ ┌──────────────────┬──────────────────┐  │
│ │ ◉  DETECTION     │ ⚠  REJECT        │  │
│ │    ACTIVE        │    ARMED         │  │
│ │    ● running     │    ● ready       │  │
│ └──────────────────┴──────────────────┘  │
└──────────────────────────────────────────┘
```

Each button is a large square-ish tile (full width / 2, ~64px tall) showing:
- Lucide icon (top-left): `ScanSearch` for Detection, `Ban` (or `OctagonX`) for Reject.
- Label line 1 (uppercase, mono, semibold): `DETECTION` / `REJECT`.
- Status line 2 (smaller, mono): `ACTIVE` / `STANDBY`, and `ARMED` / `DISARMED`.
- Small status LED dot (pulsing when active) on the right edge.

Visual states:
- **Detection ON**: filled with `bg-primary/15`, border `border-primary`, icon and labels in `text-primary`, pulsing primary dot.
- **Detection OFF**: `bg-secondary`, `border-border`, muted text, dim dot.
- **Reject ARMED**: filled with `bg-destructive/15`, border `border-destructive`, icon/text in `text-destructive`, pulsing destructive dot. Shows a subtle inner ring to read as "hot".
- **Reject DISARMED**: same neutral style as Detection OFF.

Reject also shows a tiny helper line under the tile when armed: `"Will trigger reject pulse on detection"` in `text-[9px] text-muted-foreground`. This makes the physical-machine consequence explicit without a tooltip.

Auto-scroll moves out of this block (it's a viewer concern, not a control concern) into a small icon-button row at the bottom of the sidebar header area, or stays as a compact ghost button under the Categories header. Proposal: keep it as a small `Button variant="ghost"` with a `MoveDown` icon at the top of the Categories section so the controls block is purely about machine actions.

---

## 2. Categories list redesign

Current rows feel like a form. New design treats each category as a **channel strip** in an industrial control panel.

```text
┌──────────────────────────────────────────┐
│ CATEGORIES                    6 / 8 ON   │
├──────────────────────────────────────────┤
│ ┃▌ SCRATCH                    0.65       │
│ ┃  ████████████░░░░░░░░░  thr            │
├──────────────────────────────────────────┤
│ ┃▌ DENT                      0.50       │
│ ┃  ██████████░░░░░░░░░░░  thr            │
├──────────────────────────────────────────┤
│ ░  CRACK                  ─ DISABLED ─   │
│ ░  ░░░░░░░░░░░░░░░░░░░░░                 │
└──────────────────────────────────────────┘
```

Per-row structure (rendered as a bordered "card" with `border-border bg-secondary/40`, no rounded-lg — use `rounded-sm` to feel technical):

- **Left color bar**: 3px-wide vertical bar in the class color, full row height. Acts as the visual identifier (replaces the small color square + checkbox stack).
- **Header row**:
  - Class name in mono uppercase, slightly larger (`text-[11px] font-semibold tracking-wider`).
  - Right-aligned threshold value as a tabular-nums readout `0.65` in a small "LCD-style" pill: `bg-background border border-border px-1.5 rounded-sm text-primary`.
- **Slider row**:
  - Custom-styled slider track that's taller (h-2), with tick marks at 0.0 / 0.25 / 0.5 / 0.75 / 1.0 rendered as faint vertical lines behind the track.
  - Track filled portion uses the class color (via inline style on a wrapper, overriding the default `bg-sidebar-primary`) so each row visually ties color → threshold.
  - Thumb is a small rectangular handle (not a circle) — more "fader" feel. Implemented by overriding the default `Slider` thumb classes via a `className` prop on a local wrapper, or by introducing a `<DefectClassSlider />` styled variant that wraps the Radix primitive directly.
- **Enable control**:
  - Replace the checkbox with a small **power icon button** at the far right of the header row (`Power` icon, `h-6 w-6`, `variant="ghost"`).
  - When enabled: icon in class color, subtle filled background.
  - When disabled: icon in `text-muted-foreground`, the entire row gets `opacity-50`, slider becomes inert, and the value pill shows `OFF` instead of the number. Left color bar dims to 30% opacity.
- **Hover**: row gets `bg-secondary/70` and a faint left-bar glow.

Header above the list shows a live count `6 / 8 ON` in mono, replacing `Categories (8)`.

Spacing: rows separated by a 1px `border-border` divider rather than gaps, so the list reads as one continuous rack.

---

## Technical details

**Files:**
- `src/components/defect/DefectSidebar.tsx` — main rewrite of the layout described above. Add new props `rejectEnabled: boolean` and `onRejectEnabledChange: (v: boolean) => void`. Keep all existing props.
- `src/pages/DefectDetection.tsx` — add `const [rejectEnabled, setRejectEnabled] = useState(false);` and pass through. No other logic.
- `src/index.css` — add a small keyframe `@keyframes pulse-led` for the status dots (1s ease-in-out, opacity 1 → 0.4 → 1) and a utility class `.led-pulse`. Use existing semantic tokens (`--primary`, `--destructive`, `--border`, `--secondary`, `--muted-foreground`) — no new color tokens needed.

**Icons (lucide-react):** `ScanSearch`, `Ban`, `Power`, `MoveDown` (for auto-scroll if relocated).

**Slider customization:** since the shared `Slider` component hardcodes `bg-sidebar-primary` for the range, the per-class colored fill will be done by passing `style={{ "--range-bg": "hsl(<color>)" } as React.CSSProperties}` on a wrapper `div` and adding a one-line CSS rule that targets `[data-slot="range"]` — OR, simpler and self-contained, build a small `<ChannelSlider color={cls.color} ... />` inside `DefectSidebar.tsx` that uses `SliderPrimitive` directly with inline-style overrides. Preferred: the local wrapper, to avoid touching the shared `ui/slider.tsx`.

**No changes** to: detection logic, history drawer, viewer, mock data, routing.

---

## Out of scope (explicit)

- Wiring `rejectEnabled` to any real reject-pulse mechanism — it's UI state only for now.
- Changing the Auto-scroll behavior, just possibly its location.
- Restyling the model `Select` or the top history drawer.
