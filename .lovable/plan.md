## Split History into Simple (default) and Advanced modes

Restructure `src/components/defect/DefectHistory.tsx` so the drawer opens in a stripped-down "Simple" view by default, with all filtering and sorting controls hidden behind a single "Advanced filters" toggle in the drawer header.

### Simple mode (default)

The drawer header shows:
- Title: `History`
- Right-aligned toggle button: `Advanced ▾` (chevron-down icon, ghost button, tiny mono caps)
- Results count badge

Body: just the scrollable frame list. No date picker, no quick ranges, no category chips, no confidence slider. All filters are inactive (everything passes through).

### Advanced mode (toggle expanded)

Clicking the toggle expands a controls panel between the header and the list. Toggle label flips to `Advanced ▴` and gets an active style (primary text color). Panel contains, top-to-bottom:

1. **Date** – calendar popover + clear (existing).
2. **Quick range** – 5m / 1h / Today / All buttons (existing).
3. **Categories** – multi-select chips with Clear (existing).
4. **Min confidence** – slider + 0/50/75/90% presets (existing).
5. **Sort** – segmented buttons: `Newest` (default) · `Oldest` · `Confidence ↓` · `Det count ↓`.
6. **Group by class** – switch. When ON, the list is broken into collapsible sections, one per class that appears in the (filtered) results, ordered by frequency. Each section shows the class chip + count and lists the frames whose qualifying boxes include that class. A frame appears in every matching section (not deduped) so users can scan per class.

Collapsing the Advanced panel does NOT reset filter state — the user can hide controls while keeping filters active. To make this discoverable, when filters are active but the panel is collapsed, show a small `● filters active` indicator next to the Advanced toggle, plus a one-click `Reset` next to it.

### Filter & sort semantics

Filtering logic stays as today (category + min confidence, both honored together; frames need ≥1 qualifying box when any filter is active).

Sort applies after filtering:
- Newest / Oldest: by `timestamp`.
- Confidence ↓: by max confidence among qualifying boxes.
- Det count ↓: by qualifying boxes length.

Group-by-class produces `{ classId, frames[] }[]` from the already-sorted+filtered list.

### State

New state in the component:
- `advancedOpen: boolean` — UI-only.
- `sortBy: "newest" | "oldest" | "confidence" | "count"` — default `"newest"`.
- `groupByClass: boolean` — default `false`.

Existing state (`date`, `quickRange`, `selectedClassIds`, `minConfidence`) is unchanged. `Reset` clears all four to their defaults plus resets `sortBy`/`groupByClass`.

### Scope

- Single file: `src/components/defect/DefectHistory.tsx`.
- No changes to viewer, mock data, or parent page props/API.
- Pure presentation — frames data and selection behavior unchanged.

### Technical notes

- Use existing `Switch` from `@/components/ui/switch` for "Group by class".
- Use a `ChevronDown` from `lucide-react` that rotates when open (existing pattern in the codebase).
- The "filters active" detector: `date || quickRange !== "all" || selectedClassIds.size > 0 || minConfidence > 0 || sortBy !== "newest" || groupByClass`.
- Keep the list rendering (frame row markup with class chips) extracted into a small inline component so both flat and grouped modes reuse it.
