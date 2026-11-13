# Scoped delivery plan

1. **Foundation (this slice):** original semantic tokens, eight inert components, two synthetic layouts, deterministic renderer and injection/bounds tests. Independent review required; visual QA remains unverified.
2. **Integration proof:** map a small supported Foundry model subset with explicit errors for unsupported charts/diagrams. Pin the dependency/artifact version, preserve Foundry hashes and drift checks, add roundtrip fixtures. Do not fork two independently evolving component catalogues.
3. **Component gallery and QA:** deterministic fixtures now cover every component, empty states, long text and all 12 theme/mode/density combinations. Manual QA remains pending: independently inspect light/dark, narrow/wide and printed output, contrast and keyboard focus. Honour any existing preview restrictions; never claim visual coverage from structural tests.
4. **Higher-level components:** grouped evidence tables and metadata are now available as bounded plain-text HTML primitives. Future chart/diagram panels need accessible data/text alternatives and contract/privacy review.

Exports, filters and loading controls are not present. Future exports must define visible/all-row semantics and address CSV formula injection. Do not display decorative controls suggesting unsupported behaviour.

## Progressive framework adoption

- **Now:** shared vocabulary/themes, HTML/CSS renderer and hand-written no-JavaScript example, adapter boundaries documented.
- **Next larger pilot:** a local-only Jekyll header/post-summary proof now uses built CSS and Liquid includes with synthetic fixtures. Actual Jekyll/Liquid builds and manual QA remain unverified; leave existing blog content and URLs untouched until explicitly migrated and verified.
- **Then:** React and Solid implementations only when a concrete consumer warrants them; reuse token and fixture contracts rather than copy the HTML renderer.
- Expand to complex interactive applications progressively. Do not claim chart interactions, routing, exports, hydration or framework support from directories alone.
