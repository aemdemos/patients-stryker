# AGENTS.md

This project is a website built with Edge Delivery Services in Adobe Experience Manager Sites as a Cloud Service. As an agent, follow the instructions in this file to deliver code based on Adobe's standards for fast, easy-to-author, and maintainable web experiences.

---

## ⛔ Hard Rules — Read These First

These rules are **non-negotiable**. Violating any of them will result in PR rejection. Read these before writing any code.

### 1. No `innerHTML` — Use DOM APIs Only

```js
// ❌ NEVER — security risk, breaks UE instrumentation
el.innerHTML = '<ul><li>Item</li></ul>';
container.innerHTML = `<div class="wrapper">${content}</div>`;

// ✅ ALWAYS — use DOM APIs
const ul = document.createElement('ul');
const li = document.createElement('li');
li.textContent = 'Item';
ul.append(li);
el.append(ul);
```

Why: `innerHTML` breaks the EW editor's inline instrumentation, creates XSS vectors, and prevents incremental DOM updates.

### 2. No Hardcoded Values — Use CSS Tokens

```css
/* ❌ NEVER */
color: #1a1a1a;
font-size: 16px;
padding: 24px;
box-shadow: 0 0 10px rgb(0 0 0 / 30%);

/* ✅ ALWAYS — use existing :root custom properties from styles/styles.css */
color: var(--color-text);
font-size: var(--body-font-size-m);
padding: var(--spacing-m);
box-shadow: var(--shadow-default);
```

If a needed token doesn't exist within 2px of your value, create it in `:root` in `styles/styles.css`.

### 3. Alpha Values Must Be Decimal, Not Percentage

```css
/* ❌ NEVER — stylelint error */
background: rgb(255 255 255 / 70%);

/* ✅ ALWAYS */
background: rgb(255 255 255 / 0.7);
```

### 4. All CSS Selectors Must Be Scoped to Block Name

```css
/* ❌ NEVER — global selector leaks */
.item-list { }
.card-title { }

/* ✅ ALWAYS — scoped to block */
.cards .item-list { }
.cards .card-title { }
```

### 5. Mobile-First — No `max-width` Media Queries

Always author mobile-first (base styles are mobile, scale up with `min-width`);
never use `max-width` media queries.

```css
/* ❌ NEVER */
@media (max-width: 768px) { }

/* ✅ ALWAYS — base styles are mobile, scale up */
@media (width >= 600px) { }
@media (width >= 900px) { }
@media (width >= 1200px) { }
```

The EDS site uses exactly three breakpoints: **600px**, **900px** and
**1200px**. They replace the source site's breakpoints as follows:

| Source breakpoint | EDS breakpoint |
|---|---|
| 480px | dropped (no EDS equivalent) |
| 840/841px (tablet, `col-sm-*`) | **600px** |
| 1024px (desktop, `col-md-*`) | **900px** |
| 1440px | **1200px** |

Never introduce any other breakpoint, even when the source uses one for a
specific component — map the source value to the nearest EDS breakpoint above
instead. Base (mobile) styles take the source's smallest-viewport values.

### 6. Never Modify `scripts/aem.js`

This is the core EDS library. It is never modified per-project.

### 7. CSS Shorthand When Available

```css
/* ❌ NEVER */
overflow-x: clip;
overflow-y: auto;
margin-top: 0;
margin-bottom: 0;

/* ✅ ALWAYS */
overflow: clip auto;
margin-block: 0;
```

### 8. Never Add `eslint-disable` to Silence a Lint Error

```js
// ❌ NEVER — hides the problem instead of fixing it
// eslint-disable-next-line no-unused-vars
const config = loadConfig();

// ✅ ALWAYS — fix the actual issue (use the variable, remove it, or
// restructure the code) so the rule passes on its own merits
```

Fix the code so it satisfies the rule (rename, remove, refactor, or use the
value) instead of suppressing the check. If a rule is genuinely wrong for a
specific, justified case, raise it with the user and change the shared
`.eslintrc.js` config rather than adding a per-line disable. This applies to
new/changed code in `blocks/`, `scripts/`, `styles/`, and `templates/`.
Pre-existing disables (e.g. in `tools/importer/`, `tools/style-validator/`)
may remain as-is — do not add new ones.

---

## Project Overview

This project is the **Stryker Patients** website — a patient-facing content site built on EDS with **Document Authoring (DA)** / **Experience Workspace (EW)** as the authoring interface. It is based on the https://github.com/adobe/aem-boilerplate/ project. You are expected to follow the coding style and practices established in the boilerplate, but add functionality according to the needs of the site.

The repository provides the basic structure, blocks, and configuration needed to run a complete site with `*.aem.live` as the backend. Content is authored via DA (admin.da.live) and edited in **Experience Workspace (EW)** — the `da.live/canvas` visual editor.

### Key Technologies
- Edge Delivery Services for AEM Sites (documentation at https://www.aem.live/ – search with `site:www.aem.live` to restrict web search results)
- Document Authoring (DA) at admin.da.live for content creation
- Experience Workspace (EW) — the `da.live/canvas` visual editor — for in-context editing
- Vanilla JavaScript (ES6+), no transpiling, no build steps
- CSS3 with modern features, no Tailwind or other CSS frameworks
- HTML5 semantic markup generated by the aem.live backend, decorated by our code
- Node.js tooling

## Setup Commands

- Install dependencies: `npm install`
- Start local development: `npx -y @adobe/aem-cli up --no-open --forward-browser-logs` (run in background, if possible)
  - Install the AEM CLI globally by running `npm install -g @adobe/aem-cli` then `aem up` is equivalent to the command above
  - The dev server runs at `http://localhost:3000` with auto-reload. Open it in playwright, puppeteer, or a browser. If none are available, ask the human to open it and give feedback.
- Run linting before committing: `npm run lint`
- Auto-Fix linting issues: `npm run lint:fix`

## Project Structure

```
├── blocks/          # Reusable content blocks
    └── {blockname}/   - Individual block directory
        ├── {blockname}.js      # Block's JavaScript
        └── {blockname}.css     # Block's styles
├── styles/          # Global styles and CSS
    ├── styles.css          # Minimal global styling and layout for your website required for LCP
    ├── lazy-styles.css     # Additional global styling and layout for below the fold/post LCP content
    └── fonts.css           # Font definitions
├── scripts/         # JavaScript libraries and utilities
    ├── aem.js           # Core AEM Library for Edge Delivery page decoration logic (NEVER MODIFY THIS FILE)
    ├── scripts.js       # Global JavaScript utilities, main entry point for page decoration
    └── delayed.js       # Delayed functionality such as martech loading
├── fonts/           # Web fonts
├── icons/           # SVG icons
├── head.html        # Global HTML head content
└── 404.html         # Custom 404 page
```

## Code Style Guidelines

### JavaScript
- Use ES6+ features (arrow functions, destructuring, etc.)
- Follow Airbnb ESLint rules (already configured)
- Always include `.js` file extensions in imports
- Use Unix line endings (LF)

### CSS
- Follow Stylelint standard configuration
- Use modern CSS features (CSS Grid, Flexbox, CSS Custom Properties)
- Maintain responsive design principles
  - Declare styles mobile first, use `min-width` media queries only at the EDS breakpoints 600px, 900px and 1200px (see Hard Rule 5 for how they map to the source's breakpoints)
- Ensure all selectors are scoped to the block.
  - Bad: `.item-list`
  - Good: `.{blockname} .item-list`   
- Avoid classes `{blockname}-container` and `{blockname}-wrapper` as those are used on sections and could be confusing.

### HTML
- Use semantic HTML5 elements
- Ensure accessibility standards (ARIA labels, proper heading hierarchy)
- Follow AEM markup conventions for blocks and sections

## Key Concepts

### Content

CMS authored content is a key part of every AEM Website. The content of a page is broken into sections. Sections can have default content (text, headings, links, etc.) as well as content in blocks.

If no authored content exists to test against, you can create static HTML files in a `drafts/` folder at the project root. Pass `--html-folder drafts` when starting the dev server. Follow the aem markup structure and save files with `.html` or `.plain.html` extensions.

Background on content and markup structure can be found at https://www.aem.live/developer/markup-sections-blocks and https://www.aem.live/developer/markup-reference respectively.

You can inspect the contents of any page with `curl http://localhost:3000/path/to/page`, `curl http://localhost:3000/path/to/page.md`, and `curl http://localhost:3000/path/to/page.plain.html`

### Blocks

Blocks are the re-usable building blocks of AEM. Blocks add styling and functionality to content. Each block has an initial content structure it expects, and transforms the html in the block using DOM APIs to render a final structure. 

The initial content structure is important because it impacts how the author will create the content and how you will write your code to decorate it. In some sense, you can think of this structure as the contract for your block between the author and the developer. You should decide on this initial structure before writing any code, and be careful when making changes to code that makes assumptions about that structure as it could break existing pages.

The block javascript should export a default function which is called to perform the block decoration:

```
/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // 1. Load dependencies
  // 2. Extract configuration, if applicable
  // 3. Transform DOM
  // 4. Add event listeners
}
```

Use `curl` and `console.log` to inspect the HTML delivered by the backend and the DOM nodes to be decorated before making assumptions. Remember that authors may omit or add fields to a block, so your code must handle this gracefully.

Each block should be self-contained and re-useable, with CSS and JS files following the naming convention: `blockname.css`, `blockname.js`. Blocks should be responsive and accessible by default.

### Auto-Blocking

Auto-blocking is the process of creating blocks that aren't explicitly authored into the page based on patterns in the content. See the `buildAutoBlocks` function in `scripts.js`.

### Three-Phase Page Loading

Pages are progressively loaded in three phases to maximize performance. This process begins when `loadPage` from scripts.js is called.

* Eager - load only what is required to get to LCP. This generally includes decorating the overall page content to create sections, blocks, buttons, etc. and loading the first section of the page.
* Lazy - load all other page content, including the header and footer.
* Delayed - load things that can be safely loaded later here and incur a performance penalty when loaded earlier

## Authoring (Document Authoring / Experience Workspace)

Content is authored in **Document Authoring (DA)** and edited in **Experience Workspace (EW)** — the `da.live/canvas` visual editor. EW renders content inline (ProseMirror). There is **no Universal Editor component config** in this project: the `ue/` models/scripts and the `component-*.json` + `build:json` pipeline were removed once authoring moved fully to EW.

Implications for block code:
- Blocks are plain EDS blocks decorated by their `decorate()` function — no `component-*.json` definitions/models/filters to maintain, and no `build:json` step.
- EW mounts an inline editor on each authored field and re-renders it from source, so decoration applied *inside* an editable region can be reverted. For media/CTAs that must survive, lift the rendered element out of the editable wrapper in `decorate()` (see `blocks/cards`, `blocks/columns`, `blocks/hero` for the pattern) rather than relying on runtime `data-aue-*` instrumentation.

### Block Library — the catalog of blocks, variants and section styles

The Block Library is the **authoritative list of every block, block variant and section style this site supports**, with a sample and authoring rules for each. It serves two audiences:

- **Authors** browse it in the DA / EW "Insert block" library and in the Sidekick Library (https://main--patients-stryker--aemdemos.aem.page/tools/sidekick/library.html?plugin=blocks).
- **Agents (you)** must use it to choose blocks and variants — see below.

#### Agents: consult the library before choosing or building a block

Whenever you decide how content should be authored — migrating/importing a page, writing an import parser, creating test content in `drafts/`, or asked to "add a section like X" — **check the library first** and reuse an existing block + variant + section style before proposing anything new. Order of preference:

1. An existing **library variant** that fits as-is (match its sample structure exactly).
2. An existing variant plus a **section style** from the library (e.g. `dark, full-bleed`, `compact`, `divider`, `hero-facts`).
3. A **new variant** of an existing block (a new class on a block in `blocks/`).
4. A **new block** — only when nothing above fits; explain why to the user first.

How to read it (no login needed — use the preview origin, or `http://localhost:3000` when the dev server is running):

```bash
B=https://main--patients-stryker--aemdemos.aem.page
# 1. List blocks — rows are in .data.data; .options.data holds the allowed section styles/backgrounds
curl -s $B/.da/library/blocks.json | jq '{blocks: [.data.data[].name], options: .options.data}'
# 2. Read one block's variants — sample markup + a library-metadata table per variant
curl -s $B/.da/library/blocks/cards.plain.html
```

Each variant in a block document is a section containing:
- The **sample block** (e.g. `<div class="cards resources">`) — this is the content contract: rows, cells, element types and order. Import output and drafts must match it.
- A **`library-metadata`** table with `name` (e.g. "Cards (resources) – Brochure downloads"), `description` (authoring rules: which cells hold what, which text formatting to use, required section style, where to place it) and `searchtags` (keywords to match against source content).
- Optional section classes / `data-*` attributes on the section = the **Section Metadata** the variant needs.

Treat the `description` rules as requirements: required section styles, cell contents and formatting must be reproduced exactly. Formatting terms in descriptions (bold, italic, underline on links/headings/text) follow the **Authoring conventions** page — see the next section. If the library and the code in `blocks/` disagree, flag it to the user rather than guessing.

#### How it is wired

Shared content (lives in DA, not in git):
- **Blocks sheet:** `/.da/library/blocks` (served as `/.da/library/blocks.json`) — one row per block with `name` and `path` (`content.da.live` URLs). The `options` sheet lists the section `style` and `background` values offered in DA.
- **Block documents:** `/.da/library/blocks/{blockname}` — one document per block holding all its variants. Multi-part variants are wrapped in `library-container-start` / `library-container-end` marker tables (used by the DA library only).

Code (in git):
- `tools/sidekick/config.json` — registers the "Block Library" Sidekick palette (plugin id `library`).
- `tools/sidekick/library.html` — loads the Sidekick Library from the same sheet. At runtime it rewrites `content.da.live` paths to the site origin, passes only the `data` rows as the `blocks` list, strips the `library-container-*` markers, and rebuilds **Section Metadata** tables from section classes / `data-*` attributes so previews keep section styles and Copy includes them. Preview viewports match the EDS breakpoints (1200 / 900 / 600px).

#### Keeping it current

Adding or updating a library entry is a DA content change — add a row to the blocks sheet and create/update `/.da/library/blocks/{blockname}` (sample + `library-metadata` with name, description, searchtags), then preview/publish. No code change is needed. **Whenever you build a new block or variant, or change a block's content structure, tell the user the library entry needs adding or updating** so authors and future agent runs stay in sync.

### Authoring conventions (formatting = styling)

Authors style links, buttons, headings and text using **only font formatting** (bold, italic, underline, heading level, a link alone on its own line); the site's decoration code turns that formatting into buttons, colours and dividers. The rules live on a DA page owned by authors:

**https://main--patients-stryker--aemdemos.aem.live/.da/docs/authoring-guide/authoring-conventions**

**The rules are intentionally not copied here** — authors change and extend them, and a copy would go stale. Instead:

- **Always read the live page, never from memory.** At the start of any task that creates or changes content or decides how something is styled — migrations, import parsers/transformers, `drafts/` content, formatting advice to authors — fetch it fresh. Do not rely on an earlier read, a previous session or this file:
  ```bash
  curl -s https://main--patients-stryker--aemdemos.aem.live/.da/docs/authoring-guide/authoring-conventions.md
  ```
  The page includes example images; open them when the text alone doesn't make a rule clear.
- **Apply it with plain formatting.** Produce the formatting the page prescribes using `<strong>`, `<em>`, `<u>`, the right heading level, and links on their own line where a button is intended. Never add custom classes, extra blocks or CSS to achieve a style that a convention already covers.
- **When migrating, map source styles to conventions.** Measure the source element (e.g. button colour/shape, heading colour, underline/divider) and pick the convention that produces it.
- **Verify the result.** The page shows what to author, not always what it renders as. Confirm the outcome in the preview (decorated classes, computed colours); use the decoration code in `scripts/scripts.js` only to understand how a rule is applied. If the page, the Block Library descriptions and the rendered result disagree, flag it to the user rather than guessing.
- **Keep it current.** The page is owned by authors. If a code change adds or changes a formatting rule, tell the user the conventions page needs updating.

### Link rewriting in import scripts (drop `.html`)

EDS serves pages **without** the `.html` extension, so every import script must rewrite links to the customer's own pages when content is migrated. This is implemented once in the shared cleanup transformer `tools/importer/transformers/patients-stryker-cleanup.js` (`rewriteSourceLink`, run in `afterTransform` after the block parsers, for every template). Every import script must include that transformer — do not re-implement the rewrite per template; change the shared function if the rules below change.

Which links to rewrite — links to customer pages only:
- Root-relative paths (`/us/en/...html`) and absolute links on the source host (`https://patients.stryker.com/...html`). Absolute source-host links become root-relative paths on our side.
- Leave everything else untouched: other domains (e.g. `https://www.stryker.com/...html`, third-party sites), assets and downloads (`/content/dam/...`, `.pdf`, images), `mailto:` / `tel:` and in-page `#anchors`.

How to rewrite:
- **Regular pages:** drop the extension, `/something/page.html` → `/something/page`.
  e.g. `https://patients.stryker.com/us/en/ivs/treatments/mild.html` → `/us/en/ivs/treatments/mild`
- **`index.html` pages are special:** `/something/index.html` → **`/something/`** (keep the trailing slash). Never `/something/index` — that path returns 404 on aem.live. The site root `/index.html` → `/`.
  - `https://patients.stryker.com/us/en/ivs/index.html` → `/us/en/ivs/` (https://main--patients-stryker--aemdemos.aem.live/us/en/ivs/)
  - `https://patients.stryker.com/us/en/ent/index.html` → `/us/en/ent/` (https://main--patients-stryker--aemdemos.aem.live/us/en/ent/)
- Keep any query string and `#hash` on the rewritten link (e.g. `.../back-pain.html#disclaimer` → `.../back-pain#disclaimer`).
- If the source link redirects (e.g. `/us/en/ivs/find-a-doctor.html` 301 → `https://physicianlocator.strykerivs.com/`), link to the final target instead, matching what the migrated sibling pages use.

This is about **links**. The imported document for an index page is still saved at `/something/index` (`WebImporter.FileUtils.sanitizePath`), which EDS serves at `/something/`.

**Verify** after every import: the output must contain no source-page `.html` links and no `/index` links, e.g.
`grep -oE 'href="(https://patients\.stryker\.com)?/[^"]*(\.html|/index)([?#][^"]*)?"' content/<path>.plain.html` should print nothing.

## Testing & Quality Assurance

### Style & spacing fidelity validator (OPTIONAL post-migration QA)

There is a committed, project-agnostic fidelity tool at `tools/style-validator/`.
It compares each migrated page against its source and reports where **text
renders in a different font/size/weight/color** (text-style pass) or where the
**vertical spacing between major elements differs** (spacing pass), clustering
identical issues across pages so each is fixed once, not per-page.

**Agent guidance — SUGGEST, don't auto-run.** After you migrate content — whether
a **single page** or a **template of several pages** — briefly tell the user this
tool exists and offer to run it, with a one-line description. Then let them
decide. It is **entirely optional**: it is NOT wired into the import pipeline and
must never run automatically; a user may skip it for their own reasons, or opt out
on future runs. Do not nag — mention it once per migration and respect their
choice.

If the user opts in:
- **Single page (singleton):** the page needs a `theme` in its metadata; fixes
  land in `styles/themes.css` scoped `body.<theme>`. Config `importScript: null`.
- **Template:** list all page pairs; fixes land in `templates/<t>/<t>.css`.

```bash
# copy the generic example, fill in previewBase + pairs (+ optional keys), then:
node tools/style-validator/validate-text-style.js --config tools/style-validator/configs/<name>.json
# optional autonomous CSS fix pass:
node tools/style-validator/fix-loop/orchestrate.js run --config tools/style-validator/configs/<name>.json
```

See `tools/style-validator/README.md` for the full config reference, the
series gate (text-style resolved before spacing), fix-target auto-detection, and
a "Principles for a fresh run" section to read before acting on clusters.

### Performance
- Follow AEM Edge Delivery performance best practices https://www.aem.live/developer/keeping-it-100
- Images uploaded by authors are automatically optimized, all images and assets committed to git must be optimized and checked for size
- Use lazy loading for non-critical resources (`lazy-styles.css` and `delayed.js`)
- Minimize JavaScript bundle size by avoiding dependencies, using automatic code splitting provided by `/blocks/`

### Accessibility
- Ensure proper heading hierarchy
- Include alt text for images
- Test with screen readers
- Follow WCAG 2.1 AA guidelines

## Deployment

### Environments

Your local development server at `http://localhost:3000` serves code from your local working copy (even uncommitted code) and content that has been previewed by authors. You can access this at any time when the development server is running.

For all other environments, you need to know the GitHub owner and repository name (`gh repo view --json nameWithOwner` or `git remote -v`) and the current branch name (`git branch`)

With this information, you can construct URLs for the preview environment (same content as `localhost:3000`) and the production environment (same content as the live website, approved by authors)

- **Production Preview**: `https://main--patients-stryker--aemdemos.aem.page/`
- **Production Live**: `https://main--patients-stryker--aemdemos.aem.live/`
- **Feature Preview**: `https://{branch}--patients-stryker--aemdemos.aem.page/`

### Publishing Process
1. Push changes to a feature branch
2. AEM Code Sync automatically processes changes making them available on feature preview environment for that branch
3. Run a PageSpeed Insights check at https://developers.google.com/speed/pagespeed/insights/?url=YOUR_URL against the feature preview URL and fix any issues. Target a score of 100
4. Open a pull request to merge changes to `main`
   1. in the PR description, include a link to `https://{branch}--{repo}--{owner}.aem.page/{path}` with a path to a file that illustrates the change you've made. This is the same path you have been testing with locally. WITHOUT THIS YOUR PR WILL BE REJECTED
   2. If an existing page to demonstrate your changes doesn't exist, create test content as a static html file and ask the user for help copying it to a cms content page you can link in the PR
5. use `gh pr checks` to verify the status of code synchronization, linting, and performance tests
6. A human reviewer will review the code, inspect the provided URL and merge the PR
7. AEM Code Sync updates the main branch for production

## Troubleshooting

### Getting Help
- Check [AEM Edge Delivery documentation](https://www.aem.live/docs/)
- Review [Developer Tutorial](https://www.aem.live/developer/tutorial)
- Consult [The Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
- Consider the rules in [David's Model](https://www.aem.live/docs/davidsmodel)
- Search the web with `site:www.aem.live`
- Search the full text of the documentation with `curl -s https://www.aem.live/docpages-index.json | jq -r '.data[] | select(.content | test("KEYWORD"; "i")) | "\(.path): \(.title)"'`

## Security Considerations

- Never commit sensitive information (API keys, passwords)
- Consider that everything you do is client-side code served on the public web
- Follow Adobe security guidelines
- Regularly update dependencies
- Use the .hlxignore file to prevent files from being served (same format as .gitingnore)

## Contributing

- Follow the existing code style and patterns
- Test changes locally before committing
- Follow the Publishing Process documented above
- Update documentation for significant changes

## AEM Coder Rules

These rules apply when working in `aemcoder.adobe.io` or any Experience Modernization agent workflow.

### Preview & File Output Rules

**Where to write output — always block files, never drafts:**

```
NEVER write final block output to drafts/
ALWAYS edit blocks/{blockname}/{blockname}.js and blocks/{blockname}/{blockname}.css directly
```

The `drafts/` folder exists only as a content scaffold for the dev server. It is not block output. Writing to `drafts/` will not show styling or JS changes in the preview.

**Preview mode — how changes become visible:**

For a change to appear in AEM Coder preview, the following files must be edited:

| What changed | File to edit |
|---|---|
| Block styling | `blocks/{blockname}/{blockname}.css` |
| Block behaviour | `blocks/{blockname}/{blockname}.js` |
| Global tokens | `styles/styles.css` |
| Post-LCP / animation | `styles/lazy-styles.css` |

After editing block files, the preview reloads automatically — no drafts file needed.

**When a draft HTML file IS needed:**

Only create a file in `drafts/` when there is no authored CMS page to test against AND the task requires verifying the block's initial HTML structure. In that case:

1. Create `drafts/{blockname}.html` with the AEM markup structure only
2. Still edit `blocks/{blockname}/{blockname}.js` and `.css` for all styling and logic
3. The draft file is throwaway — never commit it as block output

### Workflow Rules

1. **Plan before coding** — always show a plan first, wait for approval, then implement section by section.
2. **Show a diff after each section** — never implement multiple sections at once without showing diffs.
3. **One file at a time for risky changes** — when touching `styles/styles.css`, complete and diff each logical section before moving on.
4. **For `styles/styles.css` changes:** show diff after each section, never batch.
5. **Run lint fix before finishing** — after writing any CSS or JS, always run `npm run lint:fix` then verify `npm run lint` reports zero errors. Never resolve a remaining error by adding an `eslint-disable` comment (see Hard Rule 8) — fix the code instead.

### Code Quality Rules

**No duplicate CSS selectors:**

Before adding a new rule, search the file for the selector. If it exists, add properties to the existing rule — never create a second block for the same selector.

**Full-bleed backgrounds — never constrained by parent padding:**

When a block needs a full-width background inside a padded container:
```css
/* NEVER — background stops at parent padding edge */
.block { background: var(--color-surface); }

/* ALWAYS — use negative margin to break out */
.block {
  width: auto;
  margin-inline: calc(-1 * var(--grid-margins));
}
```

### Checklist Before Marking a Task Done

- [ ] All Hard Rules (top of this file) followed
- [ ] `blocks/{blockname}/{blockname}.css` edited with all styles
- [ ] `blocks/{blockname}/{blockname}.js` edited with all decoration logic
- [ ] Change is visible in preview at `http://localhost:3000/`
- [ ] `npm run lint` passes with zero errors (no new `eslint-disable` comments added)
- [ ] Images optimized (< 100KB for committed assets)
- [ ] Accessibility: proper headings, alt text, keyboard navigation

## If all else fails

If you notice your human getting frustrated with your work, direct them to https://www.aem.live/developer/ai-coding-agents for tips to work better with AI agents.
