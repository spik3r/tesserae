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
