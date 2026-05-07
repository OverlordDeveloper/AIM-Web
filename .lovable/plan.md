## Goal

Tone down the colors in the left "Defect Detection Settings" panel so it reads as a calm industrial control surface, not a rainbow. Class colors stay only as **identifier bars** on the left edge of each row. All interactive UI (slider fill, power button, status LED) uses neutral theme tokens, with **green** = active and **gray/white** = idle.

Scope: visual-only changes in `src/components/defect/DefectSidebar.tsx`. Possibly add one semantic token in `src/index.css` if a green isn't already convenient.

---

## Changes

### 1. Detection tile: green when active (not yellow/primary)

Currently `tone="primary"` resolves to the amber `--primary` token. Switch the Detection tile's active color to the existing `--status-online` (green, `142 71% 45%`).

- Active state: `bg-[hsl(var(--status-online))/0.15] border-[hsl(var(--status-online))] text-[hsl(var(--status-online))]`, LED dot in the same green with `led-pulse`.
- Inactive state: unchanged (neutral `bg-secondary` + muted text).
- Reject tile keeps the destructive (red) tone for ARMED — red is the correct industrial signal for a reject pulse, and the user only complained about Detection being yellow.

To keep the JSX clean, extend `ActionTile`'s `tone` union to `"success" | "destructive"` (rename `primary` → `success`) and map `success` to the `--status-online` token via arbitrary Tailwind values or a new utility. Preferred: add a tiny `--success` alias in `index.css` that points at `--status-online`, then use `bg-success/15 border-success text-success` after registering `success` in `tailwind.config.ts` (one extra color entry). This avoids inline arbitrary values everywhere.

### 2. Channel slider: neutral fill, color only on the left bar

Per category row, remove the per-class color from interactive elements:

- **Slider range fill**: change from `hsl(${cls.color})` to a neutral theme color. When **enabled**, use `hsl(var(--foreground) / 0.7)` (off-white/gray). When **disabled**, use `hsl(var(--muted-foreground) / 0.3)` (current behavior).
- **Slider thumb**: border becomes `hsl(var(--border))` always (drop the per-class border color). Thumb fill stays `bg-foreground`.
- **Threshold value pill**: text color becomes `text-foreground` instead of `text-primary` when enabled. The amber accent goes away here too.
- **Left color bar**: kept exactly as-is (3px vertical bar, full row height, class color, dimmed when disabled). This remains the only place the class color lives, acting as a quiet identifier stripe.

### 3. Power toggle button: gray ↔ green, no class color

Replace the per-class colored Power icon with a two-state neutral control:

- **Enabled**: icon in `text-[hsl(var(--status-online))]` (green), button bg `bg-background/60`, border `border-border`. Drop the inline `style={{ color: hsl(cls.color) }}`.
- **Disabled**: icon in `text-muted-foreground` (gray), transparent bg, hover lifts to `border-foreground/40`.

### 4. Categories header readout

Keep `6 / 8 ON` styling, but make the number neutral (`text-foreground`) — it's already neutral, just confirming no amber accent creeps in here.

### 5. Auto-scroll button

When active it currently uses `variant="default"` which renders amber. Switch active state to a neutral filled style: `bg-secondary text-foreground border border-border` with a small green dot prefix when ON, so it matches the calmer palette. Inactive stays ghost.

---

## Files to modify

- `src/components/defect/DefectSidebar.tsx` — all of the above. Update `ActionTile` `tone` union (`"success" | "destructive"`), `ChannelSlider` fill/thumb to neutral, Power button colors to gray/green, threshold pill text color, auto-scroll button active style.
- `src/index.css` — add `--success: 142 71% 45%;` (alias of `--status-online`) under `:root` so it's available as a semantic token.
- `tailwind.config.ts` — register `success: "hsl(var(--success))"` under `theme.extend.colors` so `bg-success/15`, `border-success`, `text-success` work.

No changes to logic, props, mock data, history drawer, viewer, or any other page.

---

## Out of scope

- Changing the Reject tile color (stays red — correct semantic for "hot" reject action).
- Changing the global `--primary` (amber) token — it's used elsewhere across the app.
- Restyling tick marks, divider lines, or row backgrounds.
