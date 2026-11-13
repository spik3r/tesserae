# Component gallery

Build with `npm run build:examples`; the committed entry point is
`examples/generated/gallery/index.html`. Each linked page is standalone HTML
with embedded styles. The index uses the repository's local stylesheet.
No JavaScript, remote assets or operational data are required.

The model in `examples/gallery-model.js` deliberately includes every public
component, empty collections, zero versus missing/unknown/not-applicable metrics,
zero/partial/full progress, long words, Unicode and escaped markup. The same
model is rendered for every shared theme, mode and density option. `auto`
follows the browser's preferred colour scheme; it is not a third palette.

## Automated checks

Tests enforce component and variant coverage, deterministic output, literal
text escaping, absence of executable/remote content in rendered variants, and
committed gallery output matching the generator. Existing renderer bounds and
semantic/contrast tests still apply. CI rebuilds all examples once per Node
matrix entry and rejects drift; no additional workflow is needed.

## Manual review checklist (not yet performed)

When browser review is permitted, inspect:

- Narrow and wide viewports: long words, table overflow and readable text.
- Light, dark and both system preferences for auto; both densities and themes.
- Keyboard navigation and visible focus on the gallery index links.
- Heading, caption, row-header, definition-list and progress announcements with
  assistive technology, including empty states and metric absence values.
- Print preview: repeated table headings, sensible breaks and contrast.
- Forced colours and enlarged text, without relying on status colour alone.

Record browser/device, variant and observed result for each actual check.
Structural tests and the existence of these fixtures do not certify visual,
print or assistive-technology behaviour. Existing preview restrictions must be
honoured; do not bypass a denied preview to complete this checklist.
