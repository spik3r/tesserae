# Plain HTML/CSS (implemented)

This is the first working renderer, not a browser framework or custom-elements package.

## CSS-only use

Copy `tesserae.css` with your HTML, link it using a relative path, and write semantic HTML as shown in [example.html](example.html). No JavaScript is required in the browser or to serve these files. The current stylesheet styles document-wide elements, so it is intended for standalone pages, not drop-in use inside an existing application's CSS without an isolation review.

Component classes include `ts-card`, `ts-metric`, `ts-status`, `ts-callout` and `ts-table-scroll`; page/layout classes include `ts-page`, `ts-dashboard`, `ts-report` and `ts-grid`. Match semantic headings, captions, headers and labels as well as classes.

## Build-time renderer

`index.js` exports `renderPage` and `componentTypes`. Node 22+ reads the bundled stylesheet and emits one complete, escaped HTML document, without client scripts. See the root README for the input model. Import via the package root or `tesserae/html` when a local package dependency is configured.

`components.css` owns HTML-specific layout and print rules. `tesserae.css` is generated from shared themes plus these rules and checked by `npm test`. A CSS-only page does not gain the Node model validator automatically; callers must ensure valid values and safely escape their data.

## Table row headers

For tables whose first column identifies each row, set `rowHeaders: true` on the table model. The renderer uses `<th scope="row">` for that first cell while preserving `<th scope="col">` column labels and ordinary `<td>` data cells. Row labels must be non-empty plain text; no labels or identifiers are inferred. The default remains ordinary data cells. The fictional report demonstrates this option. For hand-written HTML, use these same native elements and scopes. Structural tests cover the markup; screen-reader and visual/print QA remain unverified.


## Table context

Set a table's optional `description` to plain text explaining units, abbreviations or missing-value conventions. It appears on a separate line inside the native `<caption>`, keeping the explanation attached to the table without generated IDs or extra focus stops. The scroll region keeps the short table title as its accessible label. Omitted, undefined or empty descriptions retain the original title-only caption; other non-string values are rejected, and the usual text/output bounds apply. This supplies context, not automatic interpretation of cells or an assistive-technology certification.

## Report metadata and grouped tables

Use `metadata` for ordered label/value pairs under a title. It renders a native `<dl>` with `<dt>` labels and `<dd>` values, using `ts-metadata` for a responsive definition grid. Values must be explicit non-empty text, including caller-selected labels such as “Unknown”. No timestamps, owners or conclusions are invented.

Use `grouped-table` for evidence with shared column meanings and independently named groups. The parent title is a heading; every group renders a native caption, repeated column headers and the same optional row-header semantics as an ordinary table. Group descriptions supply local context. Each group has its own keyboard-focusable horizontal scroll area. The component shares one 200-row/200,000-cell-text budget across groups, preventing grouping from multiplying limits. Group order and row order are exactly caller order; no filtering, totals or classification is performed.

See `examples/report.json` for both components. Print CSS requests metadata pair and table row break avoidance, but no browser pagination, responsive appearance or assistive-technology verification is claimed. The existing preview restriction has not been retried.

## Ordered recommendations

Use `{type: 'recommendations', title, items: [{title, action, rationale?, owner?, status?}]}` for a report's proposed next steps. Native `<ol>` order and nested `<h3>` headings preserve meaning without CSS; optional owner/status use definition lists. Actions are plain text, never executable links or commands. No approval, assignment, priority or completion is inferred. Omitted context is absent; use explicit text such as “Unassigned” if that is meaningful to the author.

All supplied fields must be non-empty bounded plain text, including optional fields when supplied. Up to 32 dense items share a 100,000 UTF-16-unit text budget including the component title; the existing 8,000-unit per-field and 1 MiB page limits still apply. Empty lists say “No recommendations supplied”, not “No action required”. Native list numbers indicate supplied order, not automatically calculated priority. Shared tokens style the list; print rules keep item headings with following content without forcing lengthy items onto a single page. Structural validation is automated; visual/print/assistive-technology QA remains unverified.
