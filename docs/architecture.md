# Contract and ownership

A caller supplies `version: tesserae/v1`, title, components and optional subtitle/footer. Theme (`slate`/`sand`), mode (`auto`/`light`/`dark`), density (`comfortable`/`compact`) and kind (`dashboard`/`report`) are independent options.

Components:
- metric: title, finite numeric value, optional unit/description; or state missing/unknown/not-applicable with no value.
- status: title, label, tone neutral/positive/warning/negative. Label carries meaning independently of colour.
- progress: title, label, finite value and positive max; value must lie in [0,max].
- table: title, 1–8 column labels, 0–200 rows with exactly matching plain-text cells. A focusable scroll region provides access on narrow screens.
- section: title and up to 16 plain-text paragraphs.
- callout: title and text.

At most 64 components, 8,000 UTF-16 code units per text value, 200,000 text code units per table, 1 MiB UTF-8 final document. Unsupported components/options are refused. This JS API is not a strict JSON parser: callers must handle duplicate keys and enforce upstream schemas. Additional object properties are ignored, never interpolated. The renderer performs no aggregate computations, inference, network access or arbitrary HTML insertion. It reads its bundled CSS once. Caller input is HTML-escaped; links, executable markup, images and expression evaluation are deliberately absent.

## Foundry boundary

Foundry's existing Go `dashboard/v1` and local `report/v1` schemas remain domain/generation contracts. They must not be silently replaced with this presentation model. A future **explicit, version-pinned adapter** should map accepted models into supported Tesserae components and reject unsupported features. Chart/diagram support is not implemented in this slice. Foundry's canonical model hashes, manifests, ownership guards and output-size rules stay in Foundry. The present Node API does not imply that Go pipelines should shell out to Node; decide between shared CSS assets, a Go adapter, or a versioned renderer protocol only after a small integration proof.

The current Foundry code is unchanged. No generated output is yet using this package automatically. A future SolidJS adapter can share tokens and semantic vocabulary without requiring static reports to ship client JavaScript.
