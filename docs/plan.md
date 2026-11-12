# Scoped delivery plan

1. **Foundation (this slice):** original semantic tokens, six inert components, two synthetic layouts, deterministic renderer and injection/bounds tests. Independent review required; visual QA remains unverified.
2. **Integration proof:** map a small supported Foundry model subset with explicit errors for unsupported charts/diagrams. Pin the dependency/artifact version, preserve Foundry hashes and drift checks, add roundtrip fixtures. Do not fork two independently evolving component catalogues.
3. **Component gallery and QA:** independently inspect light/dark, narrow/wide and printed output, contrast and keyboard focus. Honour any existing preview restrictions; never claim visual coverage from structural tests.
4. **Higher-level components:** bounded chart/diagram panels with accessible data/text alternatives, grouped evidence tables and metadata. Add only after contract and privacy review.

Exports, filters and loading controls are not present. Future exports must define visible/all-row semantics and address CSV formula injection. Do not display decorative controls suggesting unsupported behaviour.
