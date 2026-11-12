# Plain HTML/CSS (implemented)

This is the first working renderer, not a browser framework or custom-elements package.

## CSS-only use

Copy `tesserae.css` with your HTML, link it using a relative path, and write semantic HTML as shown in [example.html](example.html). No JavaScript is required in the browser or to serve these files. The current stylesheet styles document-wide elements, so it is intended for standalone pages, not drop-in use inside an existing application's CSS without an isolation review.

Component classes include `ts-card`, `ts-metric`, `ts-status`, `ts-callout` and `ts-table-scroll`; page/layout classes include `ts-page`, `ts-dashboard`, `ts-report` and `ts-grid`. Match semantic headings, captions, headers and labels as well as classes.

## Build-time renderer

`index.js` exports `renderPage` and `componentTypes`. Node 22+ reads the bundled stylesheet and emits one complete, escaped HTML document, without client scripts. See the root README for the input model. Import via the package root or `tesserae/html` when a local package dependency is configured.

`components.css` owns HTML-specific layout and print rules. `tesserae.css` is generated from shared themes plus these rules and checked by `npm test`. A CSS-only page does not gain the Node model validator automatically; callers must ensure valid values and safely escape their data.
