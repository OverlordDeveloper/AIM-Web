## Add confidence filter to History drawer

Extend the existing category filter in `src/components/defect/DefectHistory.tsx` so users can also filter frames by minimum detection confidence (e.g. "show me cracks ≥ 75%").

### UX

Add a small "Min confidence" row directly under the Categories chips:

```
MIN CONFIDENCE                          75%
[──────────●────────]   [0] [50] [75] [90]
```

- A compact slider (0–100%, step 5) using the existing `Slider` component.
- Live percentage readout on the right.
- Quick preset buttons: `0%`, `50%`, `75%`, `90%` (same chip style as quick date ranges) for one-click common thresholds.
- Default value: `0%` (no confidence filter), matching today's behavior.

### Filter semantics

A frame matches when it has **at least one box** that satisfies BOTH:
- Its `classId` is in `selectedClassIds` (or no categories selected → any class), AND
- Its `confidence >= minConfidence`.

So "Crack + Dent at ≥75%" returns frames containing a Crack OR Dent box with conf ≥ 0.75. Frames with only low-confidence cracks are hidden.

The history list chips per row will also be filtered to only show class chips that have at least one qualifying box — so the row preview matches what the filter promises.

### Scope

- Only `src/components/defect/DefectHistory.tsx` changes.
- New state: `minConfidence: number` (0–1), reset to 0 when `classMap` changes (alongside the existing `selectedClassIds` reset).
- No changes to the live viewer, mock data, or parent page.
- No business logic changes — purely a presentation-layer filter on already-loaded frames.

### Technical notes

- Reuse `@/components/ui/slider`.
- Add `minConfidence` to the `useMemo` dependency array of `filtered`.
- Compute `qualifyingBoxes = f.boxes.filter(b => b.confidence >= minConfidence && (selectedClassIds.size===0 || selectedClassIds.has(b.classId)))` once per frame; keep frame if `qualifyingBoxes.length > 0`. Use that same array to derive `uniqueClassIds` and the `"N det"` count shown in the row, so the row reflects the filter.
