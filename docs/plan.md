# Scoped delivery plan

1. **Foundation (this slice):** original semantic tokens, eight inert components, two synthetic layouts, deterministic renderer and injection/bounds tests. Independent review required; visual QA remains unverified.
2. **Integration proof:** map a small supported Foundry model subset with explicit errors for unsupported charts/diagrams. Pin the dependency/artifact version, preserve Foundry hashes and drift checks, add roundtrip fixtures. Do not fork two independently evolving component catalogues.
3. **Component gallery and QA:** deterministic fixtures now cover every component, empty states, long text and all 12 theme/mode/density combinations. Manual QA remains pending: independently inspect light/dark, narrow/wide and printed output, contrast and keyboard focus. Honour any existing preview restrictions; never claim visual coverage from structural tests.
4. **Higher-level components:** grouped evidence tables and metadata are now available as bounded plain-text HTML primitives. Future chart/diagram panels need accessible data/text alternatives and contract/privacy review.

Exports, filters and loading controls are not present. Future exports must define visible/all-row semantics and address CSV formula injection. Do not display decorative controls suggesting unsupported behaviour.

## Progressive framework adoption

- **Now:** shared vocabulary/themes, HTML/CSS renderer and hand-written no-JavaScript example, adapter boundaries documented.
- **Next larger pilot:** the experimental Jekyll header/post-summary proof uses built CSS and Liquid includes with synthetic fixtures. Nine builds now pass with the blog-pinned rendering subset at root, `/synthetic-preview` and `/blog`. The [compatibility gap map](blog-compatibility.md) records exact source revisions, local layout ownership and remaining Pages/plugin/route/style gates. Full Pages/blog compatibility and manual QA remain unverified; leave existing blog content and URLs untouched until explicitly migrated and verified.
- **Article styling:** scoped `.ts-prose` rules cover trusted authored HTML using the same tokens. A synthetic Jekyll post layout and expanded Markdown fixture pass the nine root/subpath builds and output contracts. This does not add rich HTML to the JSON model or replace a real blog's content, SEO/feed handling or theme integration review.
- **Head/post metadata:** a separate [anonymous SEO/feed fixture](jekyll-metadata-proof.md) passes sixteen root/subpath and development/production builds with pinned plugins, default and custom synthetic routes, page/site author precedence and one stylesheet owner. Route URLs and Atom entry IDs have separate checks; real redirects/subscription continuity remain unverified alongside attribution/layouts and presentation.
- **Pages activation:** the opt-in [Pages 232 profile](jekyll-pages-proof.md) passes the same sixteen cases on Ruby 3.3.11 with the default plugins plus SEO/feed, safe mode and no theme. Ruby 4 resolution fails on CommonMarker. Hosted/runtime parity, remaining plugin features and real blog ownership remain unverified.
- **Then:** React and Solid implementations only when a concrete consumer warrants them; reuse token and fixture contracts rather than copy the HTML renderer.
- Expand to complex interactive applications progressively. Do not claim chart interactions, routing, exports, hydration or framework support from directories alone.
