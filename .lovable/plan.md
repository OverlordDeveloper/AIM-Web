## Revamp Defect Detection History

Replace the always-visible right-side history panel with a collapsible drawer that supports date/time browsing, with explicit Live vs Paused viewer state.

### Layout

```text
+--------------------------------------------+----+
|                                            | H  |
|         Detection viewer                   | i  |
|         (image + boxes)                    | s  |
|         [PAUSED · Resume live]             | t  |
|                                            | btn|
+--------------------------------------------+----+
```

- Default: drawer closed; viewer takes full width next to left sidebar.
- A vertical "History" tab/button is docked to the right edge (always visible) to open the drawer.
- Open drawer slides in from the right (~360–420px wide) over/next to the viewer, with an X to close.

### Drawer contents

1. Header: "History" title + close button.
2. Filter bar:
   - Date picker (single date, shadcn Popover + Calendar with `pointer-events-auto`).
   - Quick range buttons: `Last 5 min`, `Last 1 h`, `Today`, `All`.
   - Result count badge.
3. List (scrollable, dense):
   - Row = time (HH:MM:SS, mono) · detection count · class color dots.
   - Selected row highlighted.
   - Newest on top; auto-scroll-to-top while Live and on current day.

### Live vs Paused viewer state

- New `viewerMode: "live" | "paused"`.
- Live (default): viewer always shows the latest incoming frame.
- Clicking any row in the drawer → `viewerMode = "paused"`, viewer shows that frame and stops auto-updating.
- A small "PAUSED · Resume live" pill overlays the viewer top-right while paused; clicking it returns to Live and shows the latest frame.
- New frames keep streaming into history regardless of mode.

### Mock long history

- On model change, pre-generate ~6 hours of mock frames (e.g. one every ~30 s) using existing `generateMockFrame`, with timestamps spread back from now.
- Live stream continues to prepend new frames as today.
- Cap total stored frames (e.g. 2000) to keep things snappy.

### Files to modify

- `src/lib/defectMock.ts` — add a helper `generateMockHistory(model, count, intervalMs)` that returns frames with backdated timestamps. Allow `generateMockFrame` to accept an optional timestamp.
- `src/components/defect/DefectHistory.tsx` — rewrite as a drawer panel:
  - Props: `frames`, `selectedId`, `onSelect`, `classMap`, `open`, `onOpenChange`.
  - Internal filter state: `date` (Date | undefined) and `quickRange` ("5m" | "1h" | "today" | "all").
  - Filtering done in component via `useMemo`.
  - Use shadcn `Sheet` (side="right") OR a custom fixed panel; prefer `Sheet` for built-in overlay/close behavior.
  - Date picker: `Popover` + `Calendar` with `className={cn("p-3 pointer-events-auto")}`.
  - Remove `HoverCard` thumbnail previews (no longer needed).
- `src/components/defect/DefectViewer.tsx` — accept `paused: boolean` and `onResumeLive: () => void`; render a small badge/button overlay when paused.
- `src/pages/DefectDetection.tsx`:
  - State: `viewerMode`, `historyOpen`, `pausedFrameId`.
  - Stream effect: always append frames; only update `selectedId` to latest when `viewerMode === "live"`.
  - On row click: `setViewerMode("paused")`, `setSelectedId(id)`.
  - On resume: `setViewerMode("live")`, select latest.
  - On model change: call `generateMockHistory` to seed `frames`.
  - Replace inline `<DefectHistory>` column with: a thin right-edge "History" toggle button + drawer; viewer reverts to taking full remaining width.
- Remove the old `autoScroll` toggle from `DefectSidebar` (superseded by Live/Paused). Sidebar prop and page state cleaned up accordingly.

### Out of scope

- No real backend. Still mock data only.
- No changes to other pages or to the left sidebar's model/threshold controls (besides removing auto-scroll toggle).
