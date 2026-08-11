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

Why: `innerHTML` destroys UE `data-aue-*` attributes, creates XSS vectors, and prevents incremental DOM updates.

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
@media (min-width: 841px) { }
@media (min-width: 1024px) { }
```

Use the original site's breakpoints as-is. The live site's grid CSS switches at
**841px** (tablet, `col-sm-*`) and **1024px** (desktop, `col-md-*`); match those
so migrated blocks line up with the source. Only introduce a different
breakpoint when the source itself uses one for that specific component.

### 6. Never Modify `scripts/aem.js`

This is the core EDS library. It is never modified per-project.

### 7. Never Edit Root `component-*.json` Files Directly

```
❌ NEVER edit: component-definition.json, component-models.json, component-filters.json
✅ ALWAYS edit: ue/models/blocks/{blockname}.json → then run `npm run build:json`
```

### 8. UE `classes` Field — Prefer `multiselect`, but `select` When Needed

For most style variants, use `multiselect` (per DA docs — lets authors combine
options):

```json
{ "component": "multiselect", "name": "classes" }
```

Exception: on a **container block** (one with repeatable children, e.g. `cards`,
`statistics`), a `multiselect` `classes` field has been observed to break child
persistence in UE (children flatten/vanish on reload), while `select` works.
The `statistics` block uses `select` for this reason. So on container blocks,
use `select` with an explicit empty `Default` option:

```json
{
  "component": "select",
  "name": "classes",
  "value": "",
  "valueType": "string",
  "options": [
    { "name": "Default", "value": "" },
    { "name": "Resources", "value": "resources" }
  ]
}
```

Choose based on the block type and whether children persist correctly in UE.

### 9. Container Blocks Need Separate Child Definitions Per Variant

When a block variant has a different authored structure (e.g., cards with images vs cards without images), create separate child component definitions:

```json
// ❌ NEVER — reuse image+text child for a text-only variant
// Forces authors to see empty image fields they must ignore

// ✅ ALWAYS — create variant-specific child components
// cards → accepts "card" children (image + text)
// cards (cta) → accepts "card-cta" children (text only, no image field)
```

Each variant's filter should only allow its matching child type.

### 10. UE Component Definitions — Always in `ue/models/blocks/`

When creating or modifying a block with UE authoring support:

```
❌ NEVER — hand-edit root JSON or skip UE config for authorable blocks
❌ NEVER — reuse a child component model that has fields irrelevant to the variant
✅ ALWAYS — create ue/models/blocks/{blockname}.json with definitions, models, and filters
✅ PREFER — "component": "multiselect" for the classes (variant) field, but use "select" on container blocks where multiselect breaks child persistence (see Rule 8)
✅ ALWAYS — create separate child component models when variants have different fields
✅ ALWAYS — add block to section filter in ue/models/section.json
✅ ALWAYS — run `npm run build:json` after any change to ue/models/
```

Reference: https://docs.da.live/developers/reference/universal-editor

### 11. UE Instrumentation — Preserve `data-aue-*` Attributes

When a block's `decorate()` function restructures DOM (e.g., wraps children in `<ul><li>`), the original UE instrumentation attributes must be moved to the new elements:

```js
// ❌ NEVER — destroy authored elements without moving instrumentation
div.remove(); // had data-aue-* attributes

// ✅ ALWAYS — use moveInstrumentation before removing/replacing
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';
moveInstrumentation(originalDiv, newLi);
```

Add a mutation observer in `ue/scripts/ue.js` only if the block structurally transforms its children during decoration.

### 12. CSS Shorthand When Available

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

---

## Project Overview

This project is the **Stryker Patients** website — a patient-facing content site built on EDS with **Document Authoring (DA)** and **Universal Editor (UE)** as the authoring interfaces. It is based on the https://github.com/adobe/aem-boilerplate/ project. You are expected to follow the coding style and practices established in the boilerplate, but add functionality according to the needs of the site.

The repository provides the basic structure, blocks, and configuration needed to run a complete site with `*.aem.live` as the backend. Content is authored via DA (admin.da.live) and edited in-context via the Universal Editor.

### Key Technologies
- Edge Delivery Services for AEM Sites (documentation at https://www.aem.live/ – search with `site:www.aem.live` to restrict web search results)
- Document Authoring (DA) at admin.da.live for content creation
- Universal Editor (UE) for in-context WYSIWYG editing (reference: https://docs.da.live/developers/reference/universal-editor)
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
├── ue/              # Universal Editor instrumentation
    ├── scripts/         # UE-specific runtime scripts
    │   ├── ue.js            # Mutation observers & UE event handlers
    │   └── ue-utils.js      # Helpers (moveInstrumentation, moveAttributes)
    └── models/          # Source-of-truth UE component definitions (split per block)
        ├── component-definition.json   # Aggregator (uses glob refs)
        ├── component-models.json       # Aggregator (uses glob refs)
        ├── component-filters.json      # Aggregator (uses glob refs)
        ├── text.json
        ├── image.json
        ├── section.json
        ├── page.json
        └── blocks/          # Per-block UE definitions
            ├── cards.json
            ├── columns.json
            ├── fragment.json
            └── hero.json
├── component-definition.json   # BUILT OUTPUT — do not edit directly
├── component-models.json       # BUILT OUTPUT — do not edit directly
├── component-filters.json      # BUILT OUTPUT — do not edit directly
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
  - Declare styles mobile first, use `min-width` media queries at the original site's breakpoints (841px tablet, 1024px desktop) for tablet and desktop
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

## Universal Editor & Document Authoring (DA+UE)

This project uses **Document Authoring (DA)** for content creation and the **Universal Editor (UE)** for in-context WYSIWYG editing. The UE integration requires component definitions that describe how blocks can be authored and edited.

Reference documentation: https://docs.da.live/developers/reference/universal-editor

### How UE Works with EDS

When a page is opened in the Universal Editor (via `*.ue.da.live`), the editor reads three JSON configuration files from the project root to understand the available components:

| File | Purpose |
|------|---------|
| `component-definition.json` | Declares available components (blocks), their IDs, models, filters, and DA plugins |
| `component-models.json` | Defines the editing UI fields for each component (text inputs, image pickers, etc.) |
| `component-filters.json` | Controls which child components can be inserted into which parent containers |

**These root JSON files are BUILT OUTPUT.** Never edit them directly — they are generated by `npm run build:json` from the source files in `ue/models/`.

### UE Project Structure

```
ue/
├── scripts/
│   ├── ue.js           # Loaded only in UE environment — handles DOM mutation
│   │                   # observers and UE event handlers for blocks that
│   │                   # transform their DOM structure during decoration
│   └── ue-utils.js     # moveInstrumentation() and moveAttributes() helpers
└── models/             # SOURCE OF TRUTH for component definitions
    ├── component-definition.json   # Aggregator with glob refs: "./blocks/*.json#/definitions"
    ├── component-models.json       # Aggregator with glob refs: "./blocks/*.json#/models"
    ├── component-filters.json      # Aggregator with glob refs: "./blocks/*.json#/filters"
    ├── text.json                   # Default content: text component
    ├── image.json                  # Default content: image component
    ├── section.json                # Section component + section filters
    ├── page.json                   # Page-level metadata model
    └── blocks/                     # One file per block
        ├── cards.json
        ├── columns.json
        ├── fragment.json
        └── hero.json
```

### Build Pipeline (`npm run build:json`)

The `merge-json-cli` tool resolves glob references (`"...": "./blocks/*.json#/definitions"`) in the aggregator files and consolidates everything into the three root JSON files.

```bash
npm run build:json
```

A **husky pre-commit hook** automatically runs `build:json` whenever files in `ue/models/` are staged, ensuring the root files are always in sync.

### Adding UE Support for a New Block

When creating a new block that should be editable in Universal Editor:

1. **Create the block definition file** at `ue/models/blocks/{blockname}.json`:

```json
{
  "definitions": [
    {
      "title": "My Block",
      "id": "my-block",
      "model": "my-block",
      "filter": "my-block",
      "plugins": {
        "da": {
          "rows": 1,
          "columns": 2,
          "fields": [
            { "name": "image", "selector": "div:nth-child(1)>picture>img[src]" },
            { "name": "text", "selector": "div:nth-child(2)" }
          ]
        }
      }
    }
  ],
  "models": [
    {
      "id": "my-block",
      "fields": [
        {
          "component": "reference",
          "name": "image",
          "label": "Image"
        },
        {
          "component": "richtext",
          "name": "text",
          "label": "Text",
          "valueType": "string"
        }
      ]
    }
  ],
  "filters": [
    {
      "id": "my-block",
      "components": ["my-block-item"]
    }
  ]
}
```

2. **Add the block to the section filter** in `ue/models/section.json` (under `filters[0].components`).

3. **Run `npm run build:json`** to regenerate the root files (or let the pre-commit hook do it).

4. **If the block transforms its DOM** (e.g., converts `<div>` children to `<ul><li>` structure), add a mutation observer case in `ue/scripts/ue.js` to preserve instrumentation attributes via `moveInstrumentation()`.

### Block Types for UE

| Type | Description | Example |
|------|-------------|---------|
| **Simple** | Fixed fields, single content unit | Hero, Quote, Fragment |
| **Container** | Parent with repeatable child items | Cards (parent) → Card (child), Columns → Rows → Cells |
| **Key-Value** | Configuration pairs displayed as columns | Metadata, Section metadata |

### UE Instrumentation Rules

**`ue/scripts/ue.js`** is loaded ONLY when the page is opened in the Universal Editor (hostname matches `*.ue.da.live`). It has zero performance impact on the live site.

Key rules:

- **Never modify `ue/scripts/ue.js` for styling or functionality** — it exists solely to maintain UE data attributes during DOM transformations
- **`moveInstrumentation(from, to)`** — transfers all `data-aue-*` and `data-richtext-*` attributes from the original element to the decorated element. Use this when your block's `decorate()` function replaces or restructures authored DOM nodes.
- **MutationObserver pattern** — for blocks that transform children (e.g., cards converts divs to ul/li), observe mutations and re-apply instrumentation to the new elements
- **`aue:content-patch` handler** — handles image/media updates by cleaning stale srcset attributes when UE patches content

### DA Plugin Configuration

The `plugins.da` object in component definitions tells DA how to create new instances of a component:

```json
"plugins": {
  "da": {
    "name": "blockname",        // Block name for table header
    "rows": 1,                   // Number of initial rows
    "columns": 2,                // Number of columns
    "fields": [                  // CSS selectors for field mapping
      { "name": "image", "selector": "div:nth-child(1)>picture>img[src]" },
      { "name": "text", "selector": "div:nth-child(2)" }
    ]
  }
}
```

For blocks that need specific initial HTML (like hero with a picture element), use `unsafeHTML` instead:

```json
"plugins": {
  "da": {
    "unsafeHTML": "<div class=\"hero\"><div><div><picture>...</picture><h1></h1></div></div></div>",
    "fields": [...]
  }
}
```

### Hard Rules for UE Configuration

1. **Never edit root `component-*.json` files directly** — always edit in `ue/models/` and run `build:json`
2. **Every authorable block needs a model** — without it, UE shows no editing fields
3. **Container blocks need both parent and child definitions** — e.g., `cards` (container) + `card` (child item)
4. **Filters control insertion** — if a block isn't listed in `section.json` filters, authors cannot insert it
5. **Field selectors must match authored HTML** — inspect the block's initial DOM structure (before decoration) to determine correct selectors
6. **Keep `ue.js` minimal** — only add mutation observers for blocks that structurally transform their DOM during decoration
7. **Test in UE after changes** — open your page at `https://{branch}--{repo}--{owner}.aem.page/` in the Universal Editor to verify editing works

## Testing & Quality Assurance

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
| UE component config | `ue/models/blocks/{blockname}.json` then `npm run build:json` |

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
5. **Run lint fix before finishing** — after writing any CSS or JS, always run `npm run lint:fix` then verify `npm run lint` reports zero errors.

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
- [ ] `npm run lint` passes with zero errors
- [ ] If block is authorable: `ue/models/blocks/{blockname}.json` exists and `build:json` run
- [ ] Images optimized (< 100KB for committed assets)
- [ ] Accessibility: proper headings, alt text, keyboard navigation

## If all else fails

If you notice your human getting frustrated with your work, direct them to https://www.aem.live/developer/ai-coding-agents for tips to work better with AI agents.
