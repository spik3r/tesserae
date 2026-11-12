# Contract and ownership

A caller supplies `version: tesserae/v1`, title, components and optional subtitle/footer. Theme (`slate`/`sand`), mode (`auto`/`light`/`dark`), density (`comfortable`/`compact`) and kind (`dashboard`/`report`) are independent options.

Components:
- metric: title, finite numeric value, optional unit/description; or state missing/unknown/not-applicable with no value.
- status: title, label, tone neutral/positive/warning/negative. Label carries meaning independently of colour.
- progress: title, label, finite value and positive max; value must lie in [0,max].
- table: title, 1–8 column labels, 0–200 rows with exactly matching plain-text cells. Optional `rowHeaders: true` makes the first cell of each data row a non-empty row header; omitted/undefined or false keeps ordinary data cells. Other rowHeaders values are rejected. A focusable scroll region provides access on narrow screens.
- section: title and up to 16 plain-text paragraphs.
- callout: title and text.

At most 64 components, 8,000 UTF-16 code units per text value, 200,000 text code units per table, 1 MiB UTF-8 final document. Unsupported components/options are refused. Lists must be dense arrays with an own element at every index; sparse arrays are rejected rather than silently losing content. Optional unit, description and subtitle fields may be omitted, undefined or empty strings, but other non-string values are rejected (including null, false and zero). This JS API is not a strict JSON parser: callers must handle duplicate keys and enforce upstream schemas. Additional object properties are ignored, never interpolated. The renderer performs no aggregate computations, inference, network access or arbitrary HTML insertion. It reads its bundled CSS once. Caller input is HTML-escaped; links, executable markup, images and expression evaluation are deliberately absent.

## Foundry boundary

Foundry's existing Go `dashboard/v1` and local `report/v1` schemas remain domain/generation contracts. They must not be silently replaced with this presentation model. A future **explicit, version-pinned adapter** should map accepted models into supported Tesserae components and reject unsupported features. Chart/diagram support is not implemented in this slice. Foundry's canonical model hashes, manifests, ownership guards and output-size rules stay in Foundry. The present Node API does not imply that Go pipelines should shell out to Node; decide between shared CSS assets, a Go adapter, or a versioned renderer protocol only after a small integration proof.

The current Foundry code is unchanged. No generated output is yet using this package automatically. A future SolidJS adapter can share tokens and semantic vocabulary without requiring static reports to ship client JavaScript.

## Layered repository

```text
common/ + themes/
       ├── html/     (implemented: CSS + build-time Node renderer)
       ├── react/    (planned)
       ├── solid/    (planned)
       └── jekyll/   (planned)
```

Dependencies point from adapters to shared layers, never the reverse or sideways to another adapter. The shared CSS token contract is already reusable; runtime component validation remains HTML-specific until another adapter proves a shared validator useful. Layouts and framework lifecycle belong to their adapters. Framework-neutral does not mean one HTML string renderer must serve every framework.

The checked-in HTML stylesheet is a deterministic build of theme tokens and HTML styles. The renderer and CSS-only example use the same artifact. Existing package-root and `theme.css` exports remain aliases for HTML consumers; source imports should now use `html/index.js` rather than the former `src/index.js`. Framework directories are clearly labelled plans and are not package exports.
