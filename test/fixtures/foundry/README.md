# Foundry consumer fixtures

Hand-authored synthetic JSON that matches the `tesserae/v1` output of
`modeling/diagram/tesserae/export.go` in clanker-foundry at commit `357ef62`
(main; the export was added in `2d6b141`). They were not produced by running
Foundry, and the data is fictional.

`test/foundry-consumer.test.js` renders them and checks the top-level keys.
When Foundry changes its export shape, update these files and the commit above.
