# features/marketing

## Purpose

Content sections of the storefront that aren't the catalog: home hero and highlights, About page, footer (social links, contact email, partner credit).

## Owns / does not own

- **Owns:** presentational sections and their copy keys (`marketing` namespace). No tables, no server actions.
- **Does not own:** product listings (`catalog`), theme decorations (`themes`).

## Public API (`index.ts`)

- UI: `HomeHero`, `HomeHighlights`, `AboutContent`, `SiteFooter`, `SiteHeader`

## Invariants

- Only confirmed business facts are published (brand name, `Snackyzz.cookies` handle, contact email). Placeholder claims stay out of production copy.
- Brand colors and type come from tokens; images from `public/` with explicit `width`/`height` (or `next/image`).
- Server Components only, unless a section genuinely needs interactivity.

## Dependencies

`catalog` (featured products), `themes` (marks).

## Testing

- Component tests for links (social, email) and alt text.

## Gotchas

- The hero image is the LCP element; give it `priority` and a sized placeholder.
