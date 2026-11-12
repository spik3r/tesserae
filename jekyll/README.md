# Jekyll adapter (planned)

Reserved adapter boundary, **not implemented, exported or installable**. No Ruby, Liquid or Jekyll dependency is required today.

The intended first larger pilot is Kai's existing Jekyll blog. Start with pinned, prebuilt CSS and a small set of Liquid includes (page header and post summary), preserving its existing content, permalinks, SEO and feed behaviour. Do not migrate the blog or add Node to its runtime just to consume CSS. Liquid must escape textual inputs; a validated Node model does not imply Liquid inputs are safe.

Before claiming compatibility, build the pilot using its real Jekyll/GitHub Pages dependency versions, exercise relative URLs and baseurl, keyboard navigation, narrow-screen layout, content typography and existing tags. No blog changes are included in this foundation PR.
