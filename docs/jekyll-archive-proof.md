# Anonymous article archive

`jekyll/_includes/tesserae/archive.html` supplies a reusable archive using native
article cards, fixed h2/h3 headings, native dates and descriptive read links.
It preserves caller order and existing CSS tokens. The example composes the
existing article shell, head/metadata includes and frozen subset/Pages profiles;
no real blog, renderer contract, original fixture or generated CSS is changed.

The default prints escaped descriptions and never uses an excerpt as fallback.
Only boolean `trusted_excerpts=true` inserts rendered Jekyll excerpts. This is
explicit trust in site-author HTML, not a sanitizer. The [usage contract](../jekyll/README.md#article-archive)
documents author responsibility for links, heading structure, IDs and upstream
sanitization. No executable content is included in the anonymous examples.

## Examples and acceptance

`scripts/jekyll-archive-fixture.js` prepares a new temporary source and accepts
no destination argument. It overlays `jekyll/archive-fixture/` on the existing
article preparer:

```sh
node scripts/jekyll-archive-fixture.js --scenario populated --stack subset
node scripts/jekyll-archive-fixture.js --scenario empty --stack subset
```

Use `--stack pages` for the existing Pages profile. Both cases include:

- `index.html`: default escaped plain-text summaries.
- `trusted.html`: explicit boolean opt-in for rendered excerpts.
- `boundaries.html`: false, string `"true"`, numeric and missing values remain
  plain-text, with archive cards beneath h2 sections using h3 headings.
- The existing ordinary page and article layouts/destinations.

The populated case contains three anonymous dated posts in newest-first order,
escaped titles and markup-like descriptions, one absent description, and a
blank excerpt after nonblank excerpts in archive order. This last case proves
that a previous card's excerpt cannot leak into the fallback card. The excerpts
contain native emphasis and a baseurl-aware link to the ordinary page. The
empty case renders no article cards or read links, even with opt-in enabled.

Reuse a matching existing frozen lockfile and private bundle as described in
the [article-shell proof](jekyll-article-proof.md#reproduce-without-modifying-a-site).
Do not install gems globally or inherit credentials. Run the existing Pages
activation checker for Pages sources, then build production at root and `/blog`.
After each real build, run:

```sh
node scripts/verify-jekyll-archive.js --directory /path/to/output --scenario populated --baseurl /blog
```

Use `--scenario empty` and `--baseurl ''` as appropriate. The verifier checks
the exact output inventory, current stylesheet bytes, single stylesheet and
main, heading levels, card order, native dates, exact plain/trusted bodies,
descriptive read labels and local destinations. It rejects raw descriptions,
accidental opt-in, double escaping, leaked previous excerpts and broken routes.
It is specific to these anonymous examples, not validation of arbitrary HTML.

## Evidence and limits

On 15 November 2026, eight production builds and output checks passed: populated
and empty at root and `/blog` under both frozen profiles. Two Pages activation
checks passed. Subset used Ruby 4.0.5; Pages used Ruby 3.3.11, both with Bundler
4.0.11. No dependencies were installed. All 24 archive-page outputs matched six
shared snapshots after trailing-whitespace/EOF and base-path normalization.

Node tests cover preparation, recorded archive-page contracts and deliberate
corruptions. Destination stubs in those tests check link inventory only; actual
Ruby builds supply the real destinations. Node CI does not run Liquid or prove
the opt-in branch executes: changes to the include/preparer require rerunning
the real build checks. Existing metadata/article contracts remain separate.

No browser, keyboard, assistive-technology, zoom, forced-colours or print checks
were run. No HTML sanitization, arbitrary excerpt safety, custom-route archive
parity, pagination, real excerpt policy, redirects/subscriptions or hosted Pages
compatibility is established. No real blog or Foundry files changed and nothing
was deployed.
