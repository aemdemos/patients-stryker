# Section style (Experience Workspace / DA extension)

Styles the part of the page between two section breaks: background, width, layout (side by
side), line above (divider), centred text, narrow column, buttons' colour, shown on desktop or
phones, and the section roles (tab, accordion panel, carousel slide).

| | |
|---|---|
| Panel page | `tools/section-style/section-style.html` |
| Choices | `SECTION_OPTIONS` in `tools/block-options/options.js`: the same list as the Section area of Block options |
| Shared code | `section-logic.js` (fit, changes, buttons, copy) and `tools/panel-ui.js` (choice buttons), used by both panels |
| Preview | `tools/text-markers/preview.html`, whole-section mode (text and decorated blocks, corp layout) |

How an author uses it:

1. Click in a block of the section, or select a few words of its text (sections without blocks
   work too). The panel names the section ("Section 2 of 27: “Where fit …”"), says what it holds
   and shows its styles as the chosen values.
2. Only the choices that fit the section show, each with what it does written out.
3. **Copy section style**, then paste over the Style row of the section's Section Metadata (or,
   when the section has none, paste the copied table at the end of the section).
4. **Add space between sections (spacer)** copies an empty spacer section (`spacer`, `large`,
   `xlarge`, `xxlarge`, as on the patients site) to paste between two sections.

The panel doesn't write the section itself: the editor lets an extension replace only the block
or line at the cursor. While the panel is tried out, Block options keeps its Section area too.
