# features/themes

## Purpose
Storefront visual campaigns (seasonal, anniversary, campaign…). One global theme is active at a time, switched manually by an owner.

## Owns / does not own
- **Owns:** schema `themes` (themes, settings), the code registry of theme implementations (token overrides, decorative marks), the `<ThemeRoot>` that sets `data-theme`, and the admin theme picker.
- **Does not own:** base design tokens (`src/styles/tokens.css`) or components (`shared/ui`).

## Public API (`index.ts`)
- Types: `ThemeKey`, `ThemeCategory`
- Server: `getActiveTheme()` (cached, tag `themes`), `setActiveThemeAction(themeKey)`
- UI: `ThemeRoot`, `ThemeMarks`, admin `ThemePicker`

## Invariants
- Every `themes.themes.key` has exactly one entry in `registry.ts`, and vice versa. A unit test checks both directions against the seeded keys.
- A theme only overrides the documented token subset (colors, accent imagery). It never changes layout or copy.
- Components never branch on the active theme; they read tokens.
- `original` is the base theme and is always present.

## Dependencies
`access` (`themes.manage`).

## Testing
- Unit: registry ↔ DB keys contract, token override lists contain only allowed tokens.
- e2e: switching theme changes `data-theme` on the storefront without layout shift.

## Gotchas
- Render the active theme on the server (no flash of the wrong theme on load); it's part of the cached shell.
- Scheduling and per-brand themes are designed (`themes.activations`) but not built; ADR first.
