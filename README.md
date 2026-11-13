# Tesserae

Reusable presentation components and themes, starting with **plain HTML/CSS**. Foundry is a future consumer, not the owner of this library. All demonstration content is fictional.

## Layers

```text
common/    Framework-neutral vocabulary and component contract
themes/   Shared semantic CSS tokens, skins, density and colour modes
html/     Implemented: plain CSS assets and a static Node HTML renderer
react/    Planned: React components (not implemented or exported)
solid/    Planned: Solid components (not implemented or exported)
jekyll/   Planned: Liquid includes + built CSS (not implemented or exported)
```

Shared layers do not import a renderer. Future adapters consume shared tokens and the same semantic component contract, but own their framework-specific markup/lifecycle. No React, Solid or Ruby dependency is required today.

- **[Shared contract](common/README.md):** metrics, status, progress, narrative sections, callouts and tables.
- **[Themes](themes/README.md):** slate/sand skins; independent light/dark/auto modes and compact/comfortable density.
- **[Framework-less HTML/CSS](html/README.md):** use the built stylesheet directly, or generate inert, self-contained HTML with Node.
- **[Architecture](docs/architecture.md)** and **[roadmap](docs/plan.md):** integration boundaries and incremental delivery.

## Start without a framework

Copy `html/tesserae.css` beside your HTML and use the documented `ts-*` classes. See [the hand-written example](html/example.html). This route needs **no Node or client JavaScript**.

For deterministic generation at build time (Node 22+):

```js
import { renderPage } from './html/index.js';
const html = renderPage({
  version: 'tesserae/v1', title: 'Sample dashboard',
  theme: 'slate', mode: 'auto', density: 'comfortable',
  components: [{ type: 'metric', title: 'Tasks remaining', value: 0 }]
});
```

The root package export still points to this HTML renderer. No framework package has been published.

## Develop

No dependency installation required:

```sh
npm test                 # verifies committed CSS is current, then tests
npm run build:styles     # themes + HTML styles -> html/tesserae.css
npm run build:examples   # styles + four deterministic fictional examples
```

GitHub Actions runs the contract tests and rebuilds examples on Node 22 and 24, then rejects generated-asset drift. The workflow uses read-only repository permissions, pinned actions and no dependency installation. Automated accessibility contracts check native progress labels, explicit metric absence states, and calculated WCAG contrast (at least 4.5:1) for opaque semantic text tokens against the declared page, card and soft surfaces in both skins, dark/auto-dark and print palettes. The contrast test reads source tokens, not browser-computed styles; it does not verify cascade behavior, forced colours, native progress appearance or decorative borders. These checks do not replace screen/print or assistive-technology QA.

Generated examples in `examples/generated/` are reproducible local previews. Static structural checks pass; **screen/print visual QA has not been completed**. CSS requests table-header repetition and row break avoidance, but pagination remains browser-dependent. No pixel-exact PDF or page numbering guarantee.

No private reference images, source reports, branding or operational datasets belong in this repository. Do not mistake example content for evidence about a real system.
