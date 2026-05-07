## Add category filter to History drawer

Add a class/category multi-select filter inside the History drawer so users can narrow frames to ones containing specific detection classes (e.g. only "Crack").

### UI

In `DefectHistory.tsx`, between the quick-range buttons and the results count, add a "Categories" row:

- Compact horizontal wrap of toggle chips, one per class from `classMap`.
- Each chip shows: small color dot + class name.
- Selected chips: filled with `bg-muted` + `ring-1 ring-primary`.
- Unselected: outline only.
- Small `Clear` text-button on the right that resets selection (only visible when any selected).
- Default: nothing selected = "show all classes" (no filter).

### Filter logic

- New state `selectedClassIds: Set<string>` in `DefectHistory`.
- A frame matches when `selectedClassIds.size === 0` OR at least one of its `boxes[].classId` is in the set (OR semantics — matches "any of").
- Combined with existing date + quick range filters via `useMemo`.
- Empty-state message updates to "No frames match the filter" (already in place).

### Reset behavior

- When the model changes, the `classMap` keys change. Reset `selectedClassIds` to empty in a `useEffect` watching `classMap`.

### Files to modify

- `src/components/defect/DefectHistory.tsx` only.

### Out of scope

- No AND mode, no per-class threshold filter, no changes elsewhere.
