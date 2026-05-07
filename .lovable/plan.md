## Replace color dots with colored-border class chips in history list

In `src/components/defect/DefectHistory.tsx`, in the per-frame list item, replace the row of small colored dots (`uniqueClassIds.map(...)` rendering `<span className="w-2 h-2 rounded-full">`) with small pill chips showing the class name.

### Chip style
- Rounded corners (`rounded-md`), thin border in the class color, transparent background.
- Text color matches the class color.
- Compact: `px-1.5 py-0.5 text-[10px] font-mono leading-none`.
- Border + text use inline style `borderColor: hsl(var)` / `color: hsl(var)` since colors come from `cls.color`.

Example:
```tsx
<span
  key={cid}
  className="px-1.5 py-0.5 rounded-md border text-[10px] font-mono leading-none"
  style={{ borderColor: `hsl(${cls.color})`, color: `hsl(${cls.color})` }}
>
  {cls.name}
</span>
```

### Scope
- Only the chip rendering inside the history list rows changes.
- The category filter chips at the top (which already show name + dot) stay as-is.
- No logic, state, or filter changes.
