# Tesserae

Themeable web components for generated dashboards and narrative reports. **Tesserae owns presentation; Foundry owns model validation, generation and provenance.**

This first slice is a dependency-free Node renderer producing inert, self-contained HTML. It is not a browser framework, a Foundry replacement or a published package. All examples are fictional.

```js
import { renderPage } from './src/index.js';
const html = renderPage({
  version: 'tesserae/v1', title: 'Sample dashboard',
  theme: 'slate', mode: 'auto', density: 'comfortable',
  components: [{ type: 'metric', title: 'Tasks remaining', value: 0 }]
});
```

## Core pieces

- **Components:** metrics, status, progress, narrative sections, callouts and accessible plain-text tables.
- **Themes:** semantic colour tokens with slate/sand skins, independent light/dark/auto mode and compact/comfortable spacing.
- **Layouts:** dashboard grid and linear report, with narrow-screen table scrolling and A4 print CSS.
- **Data contract:** bounded plain text and finite numbers; missing, unknown and not-applicable metrics are explicit and distinct from zero.

See [contract and architecture](docs/architecture.md) for integration boundaries and [plan](docs/plan.md) for next slices.

## Develop

Node 22 or newer, no dependency installation required:

```sh
npm test
npm run build:examples
```

Generated examples in `examples/generated/` are reproducible local previews. Static structural checks pass; **screen/print visual QA has not been completed**. CSS requests table-header repetition and row break avoidance, but pagination remains browser-dependent. No pixel-exact PDF or page numbering guarantee.

No private reference images, source reports, branding or operational datasets belong in this repository. Do not mistake the example content for evidence about a real system.
