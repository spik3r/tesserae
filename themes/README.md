# Shared themes

`tokens.css` is the source of semantic CSS custom properties (`--ts-*`), skins, colour modes and density. It does not contain component markup or layout selectors. HTML and future adapters consume these same tokens rather than copy palettes.

Set `data-theme="slate|sand"`, `data-mode="auto|light|dark"` and `data-density="comfortable|compact"` on the document root. Options are independent; the current dark palette is shared across skins. Print deliberately uses a light palette.

`npm run build:styles` combines these tokens with HTML component rules into `html/tesserae.css`. Do not edit that generated stylesheet. Future framework builds can import this file and their adapter's styles separately. Token names are provisional until the first versioned release. Visual/contrast QA remains unverified.
