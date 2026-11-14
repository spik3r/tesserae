# Plain HTML/CSS (implemented)

This is the first working renderer, not a browser framework or custom-elements package.

## CSS-only use

Copy `tesserae.css` with your HTML, link it using a relative path, and write semantic HTML as shown in [example.html](example.html). No JavaScript is required in the browser or to serve these files. The current stylesheet styles document-wide elements, so it is intended for standalone pages, not drop-in use inside an existing application's CSS without an isolation review.

Component classes include `ts-card`, `ts-metric`, `ts-status`, `ts-callout` and `ts-table-scroll`; page/layout classes include `ts-page`, `ts-dashboard`, `ts-report` and `ts-grid`. Match semantic headings, captions, headers and labels as well as classes.

## Authored article typography

Wrap trusted, authored HTML in `<article class="ts-prose">…</article>` and load the same `tesserae.css` asset. [prose-example.html](prose-example.html) is a standalone fictional example with no scripts or remote assets. The wrapper styles paragraphs, headings, nested lists, blockquotes, inline code, code blocks, rules and links. It limits the reading measure to 70ch, uses shared colour/spacing tokens, and uses logical sides for list indentation and quote borders. The new rules apply only within `.ts-prose`; the rest of the stylesheet still has the documented global selectors.

Links retain underlines, use the accent token (muted after visiting), and receive an explicit keyboard-focus outline. Preformatted code preserves source whitespace while allowing long lines to wrap; it adds no horizontal scrolling region or focus stop. Print rules allow long quotes/code to split and request headings stay with following content. CSS describes these behaviours, but browser layout, keyboard, print and assistive-technology checks remain unverified.

This class is styling, not a Markdown parser or HTML/URL sanitizer. Authors own safe content, link destinations and heading order. Use it for trusted site content, or sanitize elsewhere before rendering untrusted HTML. Choose language/direction on the document or authored elements, including code where appropriate; no script guesses these values. The JSON renderer still accepts plain-text fields only and does not expose a raw-HTML/prose component. Images, embedded media, rich tables, task controls and syntax-highlight palettes are outside this prose slice. Do not wrap the whole dashboard/component grid in `.ts-prose` or combine it blindly with another theme's typography.

The experimental Jekyll fixture uses a small post layout to wrap Jekyll's rendered content in `.ts-prose` while retaining the existing document shell, title and permalink. It is a synthetic compatibility proof, not a replacement for a production blog layout, SEO/feed hooks or metadata. See [the Jekyll proof](../jekyll/README.md#authored-post-prose).

## Build-time renderer

`index.js` exports `renderPage` and `componentTypes`. Node 22+ reads the bundled stylesheet and emits one complete, escaped HTML document, without client scripts. See the root README for the input model. Import via the package root or `tesserae/html` when a local package dependency is configured.

`components.css` owns HTML-specific layout and print rules. `tesserae.css` is generated from shared themes plus these rules and checked by `npm test`. A CSS-only page does not gain the Node model validator automatically; callers must ensure valid values and safely escape their data.

## JSON command-line interface

Run `node bin/tesserae.js --help` from the repository root, or use the executable `./bin/tesserae.js`. Node 22+ is required; no package installation or build is needed. The package also declares a `tesserae` bin for local package consumers. Paths resolve from the caller's working directory, including when the executable is invoked through a symlink.

```sh
node bin/tesserae.js examples/report.json > report.html
node bin/tesserae.js - < examples/dashboard.json > dashboard.html
```

Supply exactly one regular-file path or `-` for stdin. Symlinks to regular input files are accepted. Use `./-name.json` for a filename beginning with a dash; there are no other flags except `--help` and `-h`. Directories and special-file paths are rejected; pipe producers through stdin instead. Stdin waits for EOF for inputs within the limit; there is no timeout.

Input is capped at 1 MiB (1,048,576 bytes), before UTF-8 decoding or JSON parsing. Reads stop after at most one additional byte to detect overflow, including on stdin. Invalid UTF-8 is rejected rather than replaced; a leading BOM is rejected. JSON follows `JSON.parse` semantics, including last-value-wins duplicate keys. Additional object properties are ignored by the existing renderer. This CLI does not add a schema or change the [model contract](../docs/architecture.md).

The existing renderer separately limits the complete UTF-8 HTML document to 1 MiB. HTML is fully rendered before any output is written, so input and model failures leave stdout empty. Success writes exactly the renderer's standalone HTML, with inline CSS, escaped text and no scripts or remote assets. The CLI opens no browser, makes no network requests and writes no output files itself. Shell redirection can create or truncate files before the CLI runs, even on failure; use a destination different from the input.

Exit status is `0` for rendering or help, `2` for invalid arguments, and `1` for input, rendering or output failures (including a broken pipe). Diagnostics go to stderr and omit input content, file paths and exception stacks. A rendering error can mean an invalid model, excessive rendered output, or missing renderer assets. A failed output write may leave partial HTML at the destination; no atomic output guarantee is made. Help writes usage text to stdout instead of HTML.

## Document language and direction

Set document-level `lang` and `dir` in the existing presentation model:

```js
renderPage({
  version: 'tesserae/v1', lang: 'ar', dir: 'rtl',
  title: 'تقرير تجريبي', category: 'مثال خيالي', footer: 'مثال للتوضيح فقط',
  components: [{type: 'callout', title: 'تنبيه', text: 'هذا مثال خيالي فقط.'}]
});
```

`lang` defaults to `en` and accepts a primitive string of at most 128 UTF-16 code units validated by [`Intl.getCanonicalLocales`](https://tc39.es/ecma402/#sec-intl.getcanonicallocales). Spelling is preserved, including case and aliases; syntax acceptance does not verify a translation or the language of the content. This supports Unicode language tags such as `fr`, `ar` and `zh-Hant-TW`, not all BCP 47 forms (for example, private-use-only `x-private` and grandfathered `i-klingon` are rejected). Empty, null, non-string and malformed values are rejected.

`dir` is independently optional: supply `ltr` or `rtl`, or omit it to retain the browser's default. It is not inferred from `lang`; `auto`, null, empty strings and other values are rejected. The renderer writes native [HTML language and direction attributes](https://html.spec.whatwg.org/multipage/dom.html#the-lang-and-xml:lang-attributes), so caller text and table layout inherit those semantics. Column, row, component and recommendation arrays stay in supplied order. Callout borders use `border-inline-start`, and captions/column headers use `text-align: start`; shared theme tokens remain the same. CSS-only consumers can set these same native attributes on their own document.

This is document metadata and direction support, not a translation system. Built-in labels such as “Unknown”, “No records”, “Rationale”, “Owner” and “Status” remain English. On non-English pages their elements carry `lang="en" dir="ltr"`; the default synthetic category/footer do too when not replaced by caller text. Supply category/footer in the intended document language if desired. Caller fields inherit the document language, with no per-field language or direction overrides. Numbers, dates and mixed-direction strings are not reformatted or rewritten. The existing text, component and 1 MiB HTML bounds still apply.

Run `node bin/tesserae.js examples/rtl-report.json > rtl-report.html` for an anonymous fictional Arabic report. The generated [slate](../examples/generated/rtl-report-slate.html) and [sand](../examples/generated/rtl-report-sand.html) fixtures contain mixed-script references, tables, recommendations and English fallback labels. Automated checks verify markup, escaping, order and bounds; visual layout, mixed-direction text, printing, translations and assistive-technology behaviour require separate review. No denied preview has been retried.

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
