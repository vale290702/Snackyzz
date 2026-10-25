# ADR-0009: Canonical code conventions and lint checks

- **Status:** proposed
- **Approver:** Alejandro Loaiza

## Context

Root and directory instructions prescribed incompatible layouts. Agent implementations followed older flat-file examples, and attempts to improve consistency sometimes added unnecessary wrappers and branching.

## Decision

Make `docs/code-conventions.md` required reading from root `AGENTS.md`. Align current architecture and local guides with purpose folders and role suffixes. Specify static classes for stateless helpers and named functions for factories and operation entry points. State that extraction must improve understanding and that typed internal values do not need repeated defensive checks.

Use existing ESLint plugins for multiline JSDoc and descriptive generic names, plus a small local filename rule. Test these checks and nested action import boundaries with Node's test runner. Keep framework/generated filenames and existing foundation UI/config paths explicit exceptions. No dependency is added.

## Alternatives

- Documentation alone: cheap, but mechanical violations remain easy to miss.
- A comprehensive custom style framework: more machinery than this repository needs and still cannot judge simplicity.

## Consequences

Lint catches objective violations; reviewers still judge SRP, meaningful names and control flow. Hook imports target nested `.actions.ts` modules, while repositories remain inaccessible. Existing public application APIs and authorization behavior are unchanged.
