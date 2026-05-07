## Simplify Live History on Defect Detection

Replace the bottom thumbnail strip with a compact vertical history panel docked to the right of the main viewer.

### Layout change

```text
+---------------------------+----------------+
|                           | Live History   |
|     Detection viewer      | --------------|
|     (image + boxes)       | 14:32:05  3   |
|                           |  • • •        |
|                           | 14:32:03  1   |
|                           |  •            |
|                           | ...           |
+---------------------------+----------------+
```

- Main viewer keeps its square area; history sits to its right inside `<main>`, ~240–280px wide, full height of the viewer area.
- Bottom `DefectHistory` strip is removed.

### Row content

Each row shows:
- Time (HH:MM:SS) in mono
- Detection count (e.g. "3 det")
- Small colored dots/chips for the unique classes detected in that frame (using `DetectionClass.color`)

Newest entries on top. Selected row highlighted with `ring-1 ring-primary` and `bg-muted/40`.

### Interaction

- Click a row → loads that frame into the viewer (same as today).
- Hover a row → shows a small floating thumbnail preview (~160px) of that frame next to the cursor/row, via a `HoverCard` (already in shadcn) anchored to the row.
- Auto-scroll keeps the latest row selected and scrolls the list to top when on.

### Files to modify

- `src/components/defect/DefectHistory.tsx` — rewrite as vertical compact list using `ScrollArea` (vertical), `HoverCard` for previews, class chips from `classMap`. Accepts `classMap` as a new prop.
- `src/pages/DefectDetection.tsx` — move `<DefectHistory>` from below `<DefectViewer>` into a flex row alongside it; pass `classMap`. Adjust `<main>` to `flex-row` with viewer as `flex-1` and history fixed-width on the right.

### Out of scope

No changes to mock data, sidebar, viewer rendering, or other pages.
