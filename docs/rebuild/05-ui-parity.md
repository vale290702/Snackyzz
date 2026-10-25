# UI Parity

The rebuild keeps today's UI design (G-09). Customers and admins should not notice the rework, apart from new functionality and deliberate UX improvements. This doc says what "today's UI" is, where to find it, and when a screen may differ.

## The reference

The reference is the current app on `main`: what production shows today. `DESIGN.md` records its tokens and component rules; the code on `main` is the source of truth for layout, copy, spacing and behavior that `DESIGN.md` doesn't spell out.

To look at it:

- Run the legacy app from the main checkout (`npm run dev` there, with the legacy `snackyzz` Supabase stack; stop `snackyzz-rework` first, see `supabase/AGENTS.md`) and screenshot the screen at phone and desktop widths.
- Or read the source without switching branches: `git show origin/main:src/features/pages/shop.tsx`.

| Today (hash route on `main`) | Source on `main` | Rebuilt route |
|---|---|---|
| Header, nav, footer, cart drawer | `src/components/app-shell.tsx`, `src/components/store/ui.tsx` | `src/app/(store)/layout.tsx` + feature UI |
| `#` home | `src/features/pages/home.tsx` | `/` |
| `#shop` | `src/features/pages/shop.tsx` | `/shop` |
| `#baking-stereo` | `src/features/pages/baking-hero.tsx`, `baking-stereo.css` | `/brands/[slug]` |
| `#sales` | `src/features/pages/sales.tsx` | `/where-to-buy` |
| `#about` | `src/features/pages/about.tsx` | `/about` |
| `#checkout` | `src/features/pages/checkout.tsx` (`Checkout`) | `/checkout` |
| `#success` | `src/features/pages/checkout.tsx` (`Success`) | `/orders/[number]/placed` |
| `#admin` sign-in | `src/features/admin/Admin.tsx` (`admin-login-page`) | `/admin/sign-in` |
| `#admin` panel (orders, products, settings, delivery zones, theme) | `src/features/admin/Admin.tsx`, `SeasonalSettings.tsx` | `/admin/*` |
| Seasonal themes | `src/components/seasonal/*` | `features/themes` (`data-theme`) |
| Global styles | `src/styles.css` | `src/styles/tokens.css` + Tailwind tokens |

## The rule

1. **Same screen, same design.** A rebuilt screen matches the reference: layout, hierarchy, copy, imagery, spacing, colors, type and interaction states. Rebuild it with `src/shared/ui` primitives and Tailwind tokens (the implementation changes, the result doesn't).
2. **New functionality gets new UI in the same language.** Variants, cancellation, progress statuses, points of sale vs pickup locations, Telegram linking and other new behavior may need new components or views. Build them from the existing tokens and components so they look like they were always there.
3. **Reorganize only for a real UX gain.** Moving, merging or splitting UI is allowed when it clearly improves the experience (a real route instead of a hash view, an accessibility fix, a clearer admin flow). Say what improves and for whom; "it's cleaner" isn't enough.
4. **When in doubt, match the reference** and ask, with a recommendation (AG-10).

Not deviations: Spanish copy moving into next-intl unchanged, hash routes becoming real URLs (ARC-02/03), and accessibility fixes required by WCAG 2.2 AA (Q-08).

## Evidence in every UI PR

- Before/after screenshots at phone and desktop width: the `main` screen next to the rebuilt one.
- A **Deviations** list in the PR: each visible difference, which of rules 2–3 allows it, and why. Write "None" when there are none.
