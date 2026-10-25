# docs

## Purpose

Knowledge that code can't express: the domain language, business rules, architecture decisions, and the rebuild record.

## Owns

- `domain/`: `glossary.md` (one name per concept), `order-lifecycle.md`, other business rules. **Normative**: code must match.
- `adr/`: Architecture Decision Records, `NNNN-kebab-title.md`, from `0000-template.md`.
- `rebuild/`: questionnaire, decision log, ER design, architecture, structure, UI parity. Historical record plus current spec.

## Rules

- Update `domain/` in the same PR as the code that changes a rule or a term.
- ADRs are immutable once `accepted`. To change a decision, write a new ADR that `supersedes` the old one and mark the old one `superseded`.
- ADR required for: refactors, design changes, complex features, schema changes, architectural changes, new dependencies (AG-11). Approver: Alejandro Loaiza.
- Keep documents short and link instead of repeating. Diagrams in Mermaid so they diff.
- Directory `AGENTS.md` files describe _one directory_; cross-cutting rules go in the root `AGENTS.md` or here.
