## Goal
Make the Defect Detection history panel a "recent activity" window capped at 8h. Older browsing belongs to the History page.

## Quick-range buttons
Replace current `5m / 1h / Today / All` with three options:

```text
[ 1h ] [ 4h ] [ 8h ]
```

- All are rolling "last N from now".
- `8h` = show everything the panel holds (panel itself is capped at 8h).
- Default selection: `1h`.
- Remove the date Calendar/Popover from this panel — date browsing lives on the History page. Add a small inline hint: *"Older records → History"* linking to `/history`.

## Data retention (frontend, mock for now)
In `DefectDetection.tsx`:
- Drop the `MAX_FRAMES = 2000` count cap; replace with a **time-based prune** keeping only frames where `now - timestamp ≤ 8h`.
- Prune on every new live frame and on a 60s interval (so stale entries fall off when idle).
- Seed mock history changes from 6h to 8h so the widest filter has data.
- Backend contract (later): initial REST `?since=now-8h`, WS appends; nothing else changes.

## Files to change
1. `src/components/defect/DefectHistoryPanel.tsx`
   - `QuickRange` union → `"1h" | "4h" | "8h"`; ranges array updated.
   - Remove `date` state + Calendar/Popover block.
   - Default `quickRange = "1h"`.
   - Add small footer link to `/history`.
2. `src/pages/DefectDetection.tsx`
   - `HISTORY_HOURS` 6 → 8.
   - Remove count-based slice; add 8h time-window prune in the live effect + a 60s interval.

## Out of scope
- No backend, History page, viewer, or sidebar changes.
- Categories filter and min-confidence slider unchanged.
