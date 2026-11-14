# Anonymous Jekyll article shell

This isolated integration composes the frameworkless navigation, article-footer
and prose recipes with main's pinned metadata fixture. It is not a blog migration,
an installable theme, or a change to the JSON renderer. No existing metadata or
permalink proof files are changed. Custom permalinks, redirects and subscription
continuity are outside this proof; only Jekyll's default dated routes are used.

## Ownership and adaptation

- `jekyll/_includes/tesserae/site-nav.html` receives an ordered list of trusted
  Jekyll page documents, the current document URL and a plain-text landmark label.
  It escapes titles/labels and uses `relative_url` before escaping URLs. It marks
  only an exact URL match as the current page; post pages do not mark their parent
  index link current. An empty list emits no navigation landmark.
- `article-footer.html` receives a trusted post document. It emits an article
  footer and, when neighbours exist, labelled native previous/next links with
  destination titles. Jekyll 3.10's `previous`/`next` follow collection order;
  they are not inferred from the home page's newest-first display. The fixture
  uses distinct dates and verifies all reciprocal links. Single posts omit the
  adjacent navigation. No arbitrary URL model or URL sanitizer is added.
- `jekyll/article-fixture/` owns the shell and layouts. Explicit `nav_order`
  metadata orders the index before the ordinary page. A visible skip link is
  first, pointing to the one main ID with `tabindex="-1"`. The site footer is
  outside main; the article footer is inside its article but outside prose.
- The post layout retains the existing escaped title, native date/date-format
  choice, page-before-site scalar author fallback, microformats/schema, hidden
  permalink and inert comments gate. Head/SEO/feed and analytics includes come
  unchanged from the existing metadata fixture. Rendered content is neither
  escaped nor Markdown-rendered again; authors own trusted content.
- One current Tesserae CSS asset owns presentation. Existing navigation/prose
  tokens and styles are reused without new CSS, theme Sass, menu script or adapter.
  The fixed shell uses slate/auto/comfortable; this proof does not multiply the
  frameworkless presentation matrix or claim RTL/visual acceptance.

## Cases and actual build coverage

| Case | Composition | Production | Development |
| --- | --- | --- | --- |
| sequence | Three anonymous dated posts, ordinary page, explicit navigation; full metadata with distinct site/page authors, language/date settings and inert hooks | root and `/blog`, subset and Pages | root and `/blog`, subset and Pages |
| single | One post and ordinary page; existing site-author fallback case; no hooks or adjacent navigation | root and `/blog`, subset and Pages | Recorded-output contract only |
| empty | No posts, ordinary page and empty-state index; existing minimal metadata; no author or post output | root and `/blog`, subset and Pages | Recorded-output contract only |

On 14 November 2026, **16 real builds and output checks passed**: 12 production
and four sequence development builds. **Four Pages activation checks passed**,
one per case/environment used (base path does not change plugin activation).
All **52 production HTML/XML files** matched the **13 shared snapshots** after
normalizing trailing whitespace/EOF, the first feed build timestamp and the
root-versus-`/blog` prefix. Post timestamps, plugin entities and feed content were
not rewritten. Both bundles produced equivalent recorded output.

Existing private frozen bundles were reused; no install occurred. The subset
used Ruby 4.0.5 and Pages used Ruby 3.3.11, both with Bundler 4.0.11. Pins remain
Jekyll 3.10.0, Liquid 4.0.4, Kramdown 2.4.0, GFM 1.1.0, Rouge 3.30.0, SEO 2.8.0
and feed 0.17.0; Pages uses 232 with its default plugins and theme disabled.
This is not the real blog's complete lockfile or hosted execution environment.

The verifier checks exact route/asset inventory, CSS/image bytes, one stylesheet,
local destinations, escaping, current-page state, skip target, heading count,
footer boundaries, neighbour relationships, default routes, canonical/OG/JSON-LD,
author/date semantics, feed identity/content and hook gates. The post body
contains rendered fenced code, a local image/figure and a native captioned table
with column/row headers. Metadata plugins normalize titles differently from the
escaped visible title; the verifier preserves and checks those observed values.

## Reproduce without modifying a site

From the Tesserae checkout, prepare new disposable sources:

```sh
node scripts/jekyll-article-fixture.js --scenario sequence --stack subset
node scripts/jekyll-article-fixture.js --scenario single --stack subset
node scripts/jekyll-article-fixture.js --scenario empty --stack subset
```

Repeat with `--stack pages`. The script validates arguments first and composes
main's existing metadata preparer with the article overlay in a fresh directory.
It accepts no destination, does not build/install, and never edits a real blog.
Copy the matching existing frozen profile lockfile into each disposable source.
Use an existing compatible Ruby and private `BUNDLE_PATH`, task-local
`BUNDLE_USER_HOME`, `BUNDLE_DISABLE_SHARED_GEMS=true`, `BUNDLE_FROZEN=true` and
`NO_NETRC=true`. Use a credential-free environment; do not inherit GitHub tokens
or `PAGES_REPO_NWO`. Keep logs outside fixture sources and gems outside outputs.

From each prepared source, run the Pages activation checker for Pages builds,
then build production at both base paths; repeat development for sequence:

```sh
JEKYLL_ENV=production bundle exec ruby /path/to/tesserae/scripts/check-jekyll-pages.rb
JEKYLL_ENV=production bundle exec jekyll build --baseurl /blog --destination _site-blog-production
```

The first command is for the Pages profile only. Verify every real output from
the Tesserae checkout, substituting the matching case/path/environment:

```sh
node scripts/verify-jekyll-article.js --directory /path/to/output --scenario sequence --baseurl /blog --environment production
```

Use `--baseurl ''` for root output. Preparation success is not build evidence;
the output verifier cannot establish which plugins were activated.

## Tests and remaining gates

`node --test test/jekyll-article.test.js` checks isolated preparation, recorded
output and deliberate corruptions. It rejects broken targets, wrong base paths,
wrong neighbours/current states, empty adjacent landmarks, lost body boundaries,
misplaced footer structure, metadata/author/date changes, executable scripts,
asset drift and stale output. Node CI does not install Ruby or run this matrix.
The full Node suite has 79 passing tests; existing example generation and exact
artifact checks show no drift. Original rendering/metadata fixtures remain
unchanged, and their Node contracts still pass.

No browser, preview, keyboard, forced-colours, zoom, print or assistive-technology
acceptance was performed. Semantic markup and wrapping declarations are not
proof of actual focus, layout or landmark exposure. Real routes/front matter,
redirects/subscriptions, rich excerpts, author policies beyond scalar names,
Minima/custom Sass, social/provider integrations, hosted Pages, equal-date ordering
and real content/highlighting remain separate migration gates. No real blog or
Foundry files were changed, no dependencies installed and nothing deployed.
