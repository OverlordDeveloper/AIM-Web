## Goal

Refresh the channel-strip aesthetic in the left "Defect Detection Settings" panel so the sliders + power toggles read as a cohesive industrial control surface, and move the class color identity from a vertical side bar into a bracketed colored tag like `[CRACK]` next to each row.

Scope: visual-only changes inside `src/components/defect/DefectSidebar.tsx`. No logic, props, or other files touched.

---

## Changes

### 1. Replace the left color bar with a bracketed colored tag

Remove the 3px vertical color stripe on each row. Instead, render the class name as a monospace bracketed label, e.g. `[CRACK]`, where:

- The brackets `[` and `]` and the class name are all colored with the class's HSL color (`hsl(${cls.color})`).
- When the class is disabled, desaturate to `hsl(var(--muted-foreground))` (drop the class color entirely, since the row is already faded).
- Keep the existing uppercase + tracking + font-mono styling.
- This bracketed tag becomes the row's color identity — quiet, technical, no full-height stripe.

The row container loses its colored left edge and just keeps the subtle `bg-secondary/40` hover treatment.

### 2. New slider color scheme — calm "instrument" look

Drop the off-white fill. Use a two-tone scheme that matches the rest of the panel:

- **Track**: `bg-background` with `border border-border` (unchanged shape, slightly inset).
- **Range fill (enabled)**: a muted teal/steel accent — `hsl(var(--sidebar-foreground) / 0.55)` (the existing teal-ish sidebar foreground token already in the palette). This gives the slider a distinct but understated color that isn't amber, isn't green, and ties into the teal side-panel direction noted in project memory.
- **Range fill (disabled)**: `hsl(var(--muted-foreground) / 0.25)`.
- **Thumb**: smaller fader-style rectangle, `bg-foreground` with `border-border`, drop shadow softened. No per-class color anywhere on the slider.
- **Tick marks**: keep the 5 hairline ticks but lower contrast to `bg-border/40` so they recede.

### 3. New on/off (Power) button scheme

Replace the green-when-on / gray-when-off look with a clearer two-state toggle that matches the slider palette:

- **Enabled (ON)**: filled chip — `bg-foreground/10 border border-foreground/30 text-foreground`, with a tiny LED dot in `--status-online` green to the left of the icon (inside the button) so green is reserved for the status indicator only, not the whole icon.
- **Disabled (OFF)**: `bg-transparent border-border/60 text-muted-foreground`, no dot, hover lifts border to `border-foreground/40`.
- Slightly larger hit target (`w-7 h-6`) so the LED + power icon fit cleanly side by side.

This keeps the panel feeling monochrome with one accent (green LED) reserved strictly for "live" status, matching the Detection tile's green indicator.

### 4. Threshold value pill

Tighten to match the new palette: `bg-background/60 border-border text-foreground` when ON, `bg-transparent border-border/50 text-muted-foreground` when OFF. No color changes per-class.

### 5. Row layout adjustment

Since the left vertical bar is gone, the row content gets a small left padding (`pl-2.5`) and the top line becomes:

```text
[CRACK]                          0.42  [⏻]
━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━
```

The bracketed tag replaces the previous separate uppercase name, so the name + color identity collapse into a single element.

---

## Files to modify

- `src/components/defect/DefectSidebar.tsx` — `ChannelSlider` (new range/thumb colors), per-row JSX (replace color bar with bracketed tag, restyle Power button + threshold pill).

No changes to `index.css`, `tailwind.config.ts`, or any other file. All new colors come from existing tokens (`--foreground`, `--muted-foreground`, `--border`, `--sidebar-foreground`, `--status-online`).

---

## Out of scope

- Detection / Reject action tiles at the top (unchanged).
- Auto-scroll button (unchanged).
- Model selector, header, separators (unchanged).
- Any logic, props, or non-visual behavior.
