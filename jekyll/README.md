# Jekyll adapter: experimental proof

Experimental Liquid includes and isolated fictional test sites. This is
**not exported or installable**, nor production-ready. React and Solid remain
unimplemented. No blog content, URLs, configuration or deployment is modified.

The inspected blog lockfile pins **Jekyll 3.10.0 / Liquid 4.0.4 / Kramdown 2.4.0 /
GFM parser 1.1.0 / Rouge 3.30.0** (GitHub Pages 232). The fixture pins this
rendering subset, not the full Pages plugin stack. See the revision-linked
[blog compatibility gap map](../docs/blog-compatibility.md) before planning integration.
All nine synthetic builds have been verified locally with these versions and
Ruby 4.0.5: full/minimal/empty at root, `/synthetic-preview` and `/blog`.
Output checks verified escaping, stylesheet URL and
bytes, post permalink/date, absent optional metadata and the no-post message.
This is not verification of the full GitHub Pages plugin stack or actual blog.
Structural Node tests remain separate from those real-build checks.

A separate [anonymous SEO/feed fixture](../docs/jekyll-metadata-proof.md) now
checks the two blog-pinned plugins, head/post metadata and default routes with
Tesserae as the sole stylesheet. Its sixteen-build matrix covers full/minimal/
site-author/permalink metadata at root and `/blog`, in development and production. It
checks page-author precedence, configured site-author fallback and absent
names without inventing attribution. It does not load
the full Pages stack or change the original rendering fixture below.

An opt-in [Pages 232 profile](../docs/jekyll-pages-proof.md) separately passed
sixteen builds with the default plugins plus SEO/feed, safe mode and no theme
on Ruby 3.3.11. Ruby 4.0.5 cannot resolve its CommonMarker dependency. This is
local plugin activation evidence, not hosted Pages or actual-blog compatibility.

The [custom permalink case](../docs/jekyll-metadata-proof.md#custom-permalink-case)
checks directory-style output, metadata/feed URLs and the distinct Atom entry
ID under both bundles. This does not establish redirect or feed-identity
preservation for any real route change.

The fixture explicitly pins `base64` 0.3.0 and `bigdecimal` 4.1.3, needed by
older dependencies on newer Ruby, and `kramdown-parser-gfm` 1.1.0 for Jekyll's
default Markdown input. Install in an isolated user-local bundle, not global
gems. No Ruby installation, actual blog or global gem configuration was changed.

## Scope

- `header.html`: escaped title and optional plain-text description.
- `post-summary.html`: native article, h2, date and tags. Pass a trusted Jekyll
  `post` object. Description is explicitly plain text, never excerpt HTML.
- `site-nav.html`: ordered native links from trusted page documents, with an
  explicit label and exact-URL current-page indication.
- `article-footer.html`: article-owned footer with native previous/next links
  from a trusted post document; no adjacent landmark when neither exists.
- `archive.html`: ordered native article cards, dates and descriptive read links.
  Descriptions are escaped plain text by default; rendered excerpts require the
  explicit trusted-site-content opt-in described below.
- `relative_url` is used before HTML escaping on internal links and CSS URLs.
  URL inputs are trusted Jekyll-generated paths; this is not a URL sanitizer.
  Do not use these includes with arbitrary external/untrusted URL models.
- CSS is the existing built asset. No Sass/Node runtime, scripts or new palette.
  Global typography styles mean this requires deliberate layout integration,
  not dropping the stylesheet into an existing theme blindly.

## Composed article shell

For a complete anonymous navigation/post/footer composition, start with
[`article-fixture/`](article-fixture/) and the [article-shell proof](../docs/jekyll-article-proof.md).
It reuses the metadata fixture and current CSS, with explicit page ordering,
a unique skip/main target, and an article footer outside the prose wrapper.
The three cases cover a three-post sequence, a single post and no posts, plus
an ordinary page. The proof records real subset/Pages builds, output checks
and plugin activation separately from Node recorded-output contracts.

The shell uses default dated routes and slate/auto/comfortable presentation.
The separate custom-permalink proof does not establish custom-route neighbour
behaviour in this shell. Neither proof establishes real redirects/subscription
continuity, rich excerpts, interactive menus, hosted Pages or browser/keyboard/
print/assistive-technology acceptance. Follow the proof's isolated preparation
instructions; this is not an installable theme or a real-blog migration recipe.

## Article archive

The archive takes trusted Jekyll post documents in caller-supplied order. It
does not sort, paginate, infer a summary, or fetch content. With the existing
Tesserae stylesheet loaded, use it below a page's `h1`:

```liquid
<h1>Articles</h1>
{% include tesserae/archive.html posts=site.posts %}
```

Each card has an `h2` title link, native date, optional escaped `post.description`
and a visible `Read article: <title>` link. Dates use `site.minima.date_format`
when configured, otherwise `%b %-d, %Y`. URLs use `relative_url` before escaping.
An empty/missing post list emits “No articles yet.” without empty article cards.
When embedding under an `h2`, pass `heading_level=3`; only 2/3 are supported,
with unsupported values falling back to `h2`. Existing grid/card/prose styles
and tokens own presentation; there is no script or new palette.

### Trusted rendered excerpts: explicit opt-in

The default never renders `post.excerpt`, including when a description is absent.
To render excerpts from **trusted site-author content only**, explicitly pass
the Liquid boolean `true`, or a front-matter value whose YAML type is boolean:

```liquid
{% include tesserae/archive.html posts=site.posts trusted_excerpts=true %}
```

Omitted, `false`, strings (including `"true"`), numbers and missing values do not
opt in. The flag belongs to this include call, not to a post's front matter or
a global automatic policy. On opt-in, the already-rendered `post.excerpt` is
inserted once inside `.ts-prose`; it is not escaped, rendered as Markdown again,
sanitized or URL-rewritten. Blank excerpts fall back to the escaped description.

This intentionally permits authored HTML and **is unsafe for arbitrary HTML or
untrusted submissions**. Keep sanitization upstream if the site accepts such
content; opting in does not make it safe. Site authors own the excerpt boundary
(`excerpt_separator` or explicit excerpt), URLs, language, heading hierarchy and
unique IDs. Prefer short paragraphs with links/emphasis; headings and repeated
fragment IDs need deliberate archive-level composition. No automatic truncation
or HTML repair is provided. Plain-text descriptions remain the safe default.
The existing post-summary include and JSON renderer retain their plain-text-only
contracts; this is a Jekyll-only feature, not a raw-HTML library component.

See the [anonymous archive example and proof](../docs/jekyll-archive-proof.md)
for populated/empty pages, plain/trusted modes and opt-in boundary cases. Real
blog migration, hosted Pages and browser/keyboard/print acceptance remain open.

## Authored post prose

The disposable fixture's `post` layout inherits `default` and wraps `{{ content }}` in a native `<article class="ts-prose">`. The existing document head, escaped title and post permalink remain intact. The full fictional post now exercises Kramdown headings, nested lists, a quote, inline/fenced literal code, a local fragment link and a rule. Minimal posts use the same wrapper; the empty scenario remains a no-post page. The includes and summary contract are unchanged.

Jekyll supplies rendered HTML to this layout. The wrapper deliberately does not escape or apply `markdownify` again; it is **not a sanitizer** for arbitrary submissions. Keep the site's existing trust/sanitization policy. The JSON renderer's plain-text-only boundary is unchanged. `.ts-prose` uses the existing tokens and has no JavaScript, Ruby extension or syntax-highlight palette. See [article typography](../html/README.md#authored-article-typography) for the scoped styles and limits.

The nine-build matrix passed with the prose wrapper and the pinned rendering subset above, using an isolated bundle copy with Kramdown 2.4.0 installed. The output verifier checked the article boundary, native prose markup, escaped code and fragment target alongside the existing CSS, route and metadata checks. Node tests exercise those contracts using hand-authored output and deliberate corruptions; CI does not run Ruby. This does not verify actual blog content, Pages plugins, coloured code highlighting, browser layout, print, keyboard or assistive technology.

The full fixture also contains a local fictional SVG, once as a small Markdown
image and once in a native figure with a caption. Both provide dimensions and
descriptive alt text. Preparation copies the asset from `html/assets`; the
verifier checks exact bytes, generated attributes and root/subpath image URLs.
Nine fresh rendering builds passed with these additions, and the separate
eight-build metadata matrix passed again with the updated shared CSS. No gems
were installed for this follow-up. These checks verify output and stylesheet
parity, not browser image decoding, resizing, print or accessibility.

## Prepare an isolated fixture

Run `node scripts/jekyll-fixture.js` from the repository. It prints a new
system-temp directory containing only synthetic fixture files, includes and
current prebuilt CSS. It never writes to an existing blog. Preparation requires
Node, but the resulting Jekyll site itself does not.

Prepare each edge case in its own fresh directory rather than editing the full
fixture by hand:

```sh
node scripts/jekyll-fixture.js --scenario full    # default: escaped text + tags
node scripts/jekyll-fixture.js --scenario minimal # post without description/tags
node scripts/jekyll-fixture.js --scenario empty   # no posts
```

Each command prints a different directory. No output-directory argument is
accepted. If capturing build logs, store them outside the fixture source; Jekyll
can copy ordinary log files into generated output, including local paths. The preparation tests check fixture contents, not Liquid execution.

With the fixture bundle installed in an isolated location, from that temporary
directory (set `BUNDLE_PATH` to the same isolated gem directory used to install):

```sh
bundle exec jekyll build --destination _site
bundle exec jekyll build --baseurl '' --destination _site-root
bundle exec jekyll build --baseurl /blog --destination _site-blog
```

Do not infer a successful build from fixture preparation. Check all three outputs
for escaped title/description/tag markup, correct `/synthetic-preview/`, `/blog/`
and root links, stylesheet resolution and unchanged synthetic post permalink. Repeat these
builds for all three scenarios. The minimal scenario should omit its post
description/tag markup while keeping its article/link/date; the empty scenario
should say “No posts yet.” and contain no post articles. No browser
preview is authorised by this checklist; honour existing preview restrictions.

Independent source review and the synthetic builds passed. Any later changes
must repeat these checks. Blog integration still needs its own compatibility
review, including Pages plugins, SEO/feed tags, code highlighting and routes.
Keyboard, visual, print and assistive-technology QA remain pending.

## Repeatable output-contract verification

After each **real Jekyll build**, run the read-only fixture verifier against its
destination. For example, from the Tesserae repository:

```sh
node scripts/verify-jekyll.js --directory /path/to/full-fixture/_site --scenario full --baseurl /synthetic-preview
node scripts/verify-jekyll.js --directory /path/to/full-fixture/_site-root --scenario full --baseurl ''
node scripts/verify-jekyll.js --directory /path/to/full-fixture/_site-blog --scenario full --baseurl /blog
```

Repeat for `minimal` and `empty`, using each scenario's separate build
destination. It checks expected escaped strings, native summary structure,
permalink/date, root/subpath stylesheet links, exact current CSS bytes, absent
optional metadata and empty-state/stale-post output. A missing build or mismatch
fails with a nonzero exit status. No files are written, no builds run, and no
network or browser access occurs.

This is a deliberately exact contract for the known synthetic fixture, **not**
a general HTML parser, sanitizer, content validator or visual/accessibility
audit. It is not suitable for arbitrary blogs. The Node test suite exercises
the verifier with hand-authored output and corruption cases, not actual Liquid
execution; passing Node CI does not claim the nine real Jekyll builds ran.
The verifier has also passed against nine fresh real builds with the pinned
rendering subset on Ruby 4.0.5: full/minimal/empty at root,
`/synthetic-preview` and `/blog`. These builds used an isolated local bundle.
This validates generated output contracts, not visual, print, keyboard or
assistive-technology behaviour.

## Composing post-summary headings

The default summary heading remains `h2` for a list directly under a page's
`h1`. Set `heading_level=3` (numeric or the string `"3"`) when summaries sit
beneath an `h2` such as “Posts”:

```liquid
<h2>Posts</h2>
{% for post in site.posts %}
  {% include tesserae/post-summary.html post=post heading_level=3 %}
{% endfor %}
```

Only fixed `h2` and `h3` tag names can be emitted. Omitted, unsupported and
malformed values fall back to `h2`; input is never interpolated as a tag name.
The caller still owns the surrounding hierarchy. The fictional
`heading-levels.html` fixture exercises default, numeric/string 3, unsupported
6 and markup-like input. This is structural composition, not a claim of
screen-reader verification.

For a Minima-style consumer, retain its document head, SEO/feed hooks,
language, post routes, date-format choice, author/microformat metadata and
content handling. The current summary is not a substitute for a full post
layout or rich excerpts. Tesserae CSS contains document-wide selectors and
must not simply be layered over an existing theme. First pilot a separate
synthetic layout with one stylesheet owner; migrate real content only after
route, plugin and presentation compatibility are separately verified.
