# React adapter (planned)

Reserved adapter boundary, **not implemented, exported or installable**. No React dependency is required for the current HTML/CSS version.

A future adapter should render semantic components through idiomatic props/JSX, consume `themes/tokens.css`, and follow `common/` data meanings. It must not invoke the Node HTML renderer or inject its output with `dangerouslySetInnerHTML`. Require shared-fixture parity, accessibility tests and SSR/hydration coverage before claiming support.
