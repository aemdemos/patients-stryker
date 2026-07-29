## Phase 0: Preflight

Do these three checks BEFORE any extraction. They were added after real runs
where skipping them wasted a whole pass or blew the context budget.

### 0.1 Idempotency — is this a fresh run or a re-run?

Check for a prior run before regenerating anything:

- If `migration-work/design-system-extracted.json` exists, OR `styles/styles.css`
  already contains site-specific (non-boilerplate) values → this is a **RE-RUN**.
- In a re-run, the goal is **verify-and-reconcile**, not regenerate from scratch:
  1. Still collect fresh source data (Phases 1–9) — the source is the source of truth.
  2. In Phase 11, **diff** the freshly-extracted values against the existing
     `styles.css` and change ONLY what differs. Do not rewrite the file wholesale.
  3. Record every diff (old → new, with provenance) so the change set is auditable.
- If a git baseline commit of the untouched boilerplate exists, note its hash so
  boilerplate-vs-migrated provenance can be diffed later (`git show <hash>:styles/styles.css`).

**Why:** regenerating from the template silently discards hand-tuned prior work
and hides what actually changed. A re-run that can't say "here is exactly what
changed and why" has failed.

### 0.2 Token-budget rules for large sites

Real production sites ship 100KB–1MB+ of CSS and dozens of inline `<style>`
blocks. Returning that through a tool result truncates and wastes context.

- **Public stylesheets → fetch with `curl` straight to disk**, never through
  `browser_evaluate`. The in-browser fetch in Phase 1.2 is ONLY needed to defeat
  CORS or auth-gated CSS. If a URL is publicly reachable, use:
  `curl -fsSL "<url>" >> migration-work/raw-css-corpus.txt`
- **`browser_evaluate` must return METADATA, not payloads.** When enumerating
  stylesheets or inline blocks, return counts, lengths, and URLs — never the CSS
  text. Fetch the bytes separately to disk.
- **Inline `<style>` blocks:** return `{index, length}` only. Extract the few you
  need (e.g. `@font-face`) with a targeted regex, not by dumping the block.
- If any single evaluate result would exceed ~25K tokens, split it.

### 0.3 Sample MORE THAN ONE page

One page never reveals the whole design system. Before Phase 1, pick a
**representative set** (typically 2–4): the homepage/landing template plus at
least one deep content page (article/detail) and, if they differ, a listing or
form page.

- Run the computed-style capture (Phase 1.4) on each sampled page.
- Merge findings. When a heading level or element renders **differently** across
  pages, that's a **variant**, not a contradiction — record all variants (see the
  variant note added to Phase 4).

