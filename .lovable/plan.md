## Goal
Replace the overlay drawer for History on the Defect Detection page with a layout that doesn't cover the image.

## Approach: Inline right-side panel (collapsible)

Make History a regular column in the page layout, sitting to the right of the viewer — same pattern as the left `DefectSidebar`. The image area shrinks to fit the remaining space instead of being covered.

```text
┌─────────────────────────────────────────────────────────────┐
│ TopNav                                                      │
├──────────────┬────────────────────────────┬─────────────────┤
│              │                            │                 │
│  Controls    │     Detection Viewer       │    History      │
│  Sidebar     │     (square, fits)         │    (filters +   │
│  (left)      │                            │     list)       │
│              │                            │                 │
│              │                            │  [collapse →]   │
└──────────────┴────────────────────────────┴─────────────────┘
```

### Behavior
- Default: History panel open (~320px wide), docked right, flush with the viewer.
- Collapsed state: panel collapses to a thin vertical rail (~28px) showing a vertical "HISTORY" label + icon. Click rail to expand, click a chevron in the panel header to collapse.
- Viewer always uses remaining space; the square image auto-scales — never overlapped.
- State persists in component state (and optionally `localStorage` for the open/collapsed pref — small addition, easy to drop).

### Changes
1. **`src/pages/DefectDetection.tsx`**
   - Remove the floating edge `Button` and the `DefectHistory` Sheet usage.
   - Wrap viewer + history in a flex row inside `<main>`. Replace `historyOpen` with `historyCollapsed`.
   - Render new `<DefectHistoryPanel>` as a sibling of `<DefectViewer>`.

2. **New `src/components/defect/DefectHistoryPanel.tsx`** (extracted from `DefectHistory.tsx`)
   - Same filters (date, quick range, categories, min confidence) and list, but rendered as a plain panel — no `Sheet`/overlay.
   - Header with title + collapse chevron button.
   - When collapsed: render only a 28px-wide rail with vertical "HISTORY" text and an expand chevron.
   - Styled consistently with `DefectSidebar` (border-l, bg-card, mono labels).

3. **`src/components/defect/DefectHistory.tsx`** — keep file but no longer used on this page (or delete; safe to remove since no other imports — will verify before removing).

### Why inline over alternatives
- Bottom strip would steal vertical room from a square viewer (height-constrained already).
- Overlay (current) hides the very content the user is inspecting — the complaint.
- Inline right column keeps everything visible at once and matches the existing left-sidebar pattern, so the layout reads as a single workspace.

### Out of scope
- No changes to filters, mock data, or detection logic.
- No restyling of the viewer or left sidebar.