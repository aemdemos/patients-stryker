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

How an author uses it (the panel shows the same three steps):

1. **Point at the section:** click in one of its blocks, or select a few words of its text
   (sections without blocks work too). The panel names the section ("This section: 2 of 27,
   “Where fit …”"), says what it holds and previews it, pinned at the top.
2. **What do you want to do?** The choices by task, each with a stryker.com example and what
   each choice does: colour behind it, put its parts side by side, line above / more space
   (divider, and spacer sections to paste), centre or narrow the text, button colour, show only
   on desktop or phones, make it a tab / accordion panel / carousel slide. Only the tasks that
   fit the section show; a task the section uses is open with its current value.
3. **Copy and paste:** Copy section style, then paste where the picture shows (over the Style
   row of the section's Section Metadata, or a new table at the end of the section).

The panel doesn't write the section itself: the editor lets an extension replace only the block
or line at the cursor. While the panel is tried out, Block options keeps its Section area too.
