---
target: Snackyzz catalog UX
total_score: 21
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-10-26T04-14-51Z
slug: src-features-catalog-ui
---
Method: dual-agent (A: /root/design_review · B: /root/detector_review)

Source-grounded critique of src/features/catalog/ui. Actual catalog visuals could not be reviewed: shared Supabase returns PGRST000, cannot resolve supabase_db_snackyzz-rework. Captures at 390 and 1440 show error boundaries and failed owner login.

Design specificity: Preserve Snackyzz cream/chocolate/orange, Fraunces/DM Sans, and Baking Stereo's existing editorial language. The main weakness is the admin's record-oriented workflow, not the visual identity.

| Heuristic | Score | Key issue |
|---|---:|---|
| System status | 2 | No save toast or Suspense fallbacks |
| Real-world match | 3 | Numeric position and presentation management expose internal structure |
| User control | 1 | No dirty guard or list restoration |
| Consistency | 3 | Shared primitives, inconsistent save outcomes |
| Error prevention | 1 | Product save may leave no sellable presentation |
| Recognition | 2 | Package choices hidden behind details |
| Efficiency | 2 | Single-price editing requires a separate presentation form |
| Minimalism | 2 | Optional metadata precedes price |
| Recovery | 3 | Preserved fields and translated errors |
| Help | 2 | Missing first price explained too late |
| Total | 21/40 | Acceptable; substantial workflow improvements needed |

Strengths: Named full-label price radio cards; Radix dialog semantics and 44px close control; preserved fields and associated translated errors.

Priority issues:
1. P1: Saving a product does not make it sellable. Include first presentation in creation. Existing incomplete rows need an explicit missing-presentation status instead of zero price. Suggested command: impeccable shape.
2. P1: Multi-presentation card silently chooses default. Show minimum Desde price, count and Elegir presentación. Suggested command: impeccable clarify.
3. P1: Editor loses orientation and dirty work. Sheet above unchanged list with guarded close and return focus. Suggested command: impeccable harden.
4. P2: Optional metadata competes with essentials. Progressive disclosure, generated editable-on-request slug, searchable categories, color swatches, up/down ordering. Suggested command: impeccable distill.
5. P2: Blank waiting and weak completion feedback. Shaped skeletons and save toast. Suggested command: impeccable polish.

Cognitive load: High in admin creation: product versus presentation, slug syntax, numeric order and optional categories precede selling essentials. Category lists can exceed four choices. Reveal complexity as needed.

Emotional journey: Storefront begins with appetite but hides package choices. Admin creation ends with a false finish: saved but absent from shop. A truthful sellable save and toast improve the end.

Personas: Casey must scroll through mobile detail to purchase. Alex opens two forms to change a single price and loses phone list position. Sam needs focus restored to the triggering row and dirty confirmation focus returned correctly.

Minor observations: Keep tabular currency, optional SKU beside price, existing image preview and upload save blocking; widen desktop sheet beyond shared default.

Detector: 0 findings, exact JSON [], exit 0. No false positives. Native browser unavailable/blocked localhost; no overlay. Separate Playwright Chrome captures show actual environment failures.

Options:
Storefront A recommended: minimum Desde + count, select in detail; B default price labelled by presentation + count; C inline card picker. Phone detail uses requested bottom sheet and sticky selected price/action; desktop two-column unchanged.
Admin A recommended: inline one-presentation fields, expand to list at second; B always-visible presentation list seeded with first form; C guided product then presentation wizard. One user submission must include first presentation with existing capabilities, no schema/money/stock change.
Editor A recommended: desktop right sheet, mobile full-height sheet; B desktop existing side panel/mobile sheet; C dedicated route with deep links.

Questions: Can save mean ready to sell? Does the owner need presentation management before adding a second?
