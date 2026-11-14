# Common contracts

Framework-neutral semantic vocabulary lives here. `options.js` exports frozen lists of supported themes, modes, densities, layouts and directions (`ltr`/`rtl`) without Node, browser or framework dependencies. The current component data contract is documented in [architecture](../docs/architecture.md); HTML validation is implemented by the HTML renderer, not falsely advertised as a cross-framework runtime validator.

Adapters should agree on meaning: zero differs from missing/unknown/not-applicable; status has a visible label; progress has a bounded value and maximum; tables have column headers and text cells, with optional first-column row headers to identify each row. They may expose idiomatic APIs, but cannot silently change those semantics. No DOM nodes, JSX, Liquid, CSS class rendering or application-specific models belong in this layer.

Before adding an adapter, introduce shared fixtures to prove equivalent content, labels and invalid-data handling. Keep escaping at each renderer's output boundary, not in shared input data. Do not pass raw HTML between adapters.

Report adapters can represent metadata as ordered label/value pairs and grouped tables as ordered tables sharing column meanings. Preserve group captions and row/column header relationships; grouping does not infer categories, counts, severity or conclusions. These additions remain HTML implementations until another adapter is verified.

Recommendations preserve supplied item order and explicit action, rationale, owner and status text. Order is not inferred priority; missing context does not imply approval or completion. Native semantics and safe escaping remain adapter responsibilities.

Document `lang` describes the caller's text language; optional `dir` sets its base writing direction independently. Neither translates content, reformats numbers nor reverses arrays. Adapters should preserve these semantics and distinguish any built-in labels' language from supplied text. The HTML renderer currently accepts bounded Unicode language tags and retains English built-in labels with explicit English metadata on non-English pages. React, Solid and Jekyll do not gain a language adapter automatically from this vocabulary.
