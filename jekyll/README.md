# Jekyll adapter: experimental proof

Two experimental Liquid includes and a fictional disposable test site. This is
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
Tesserae as the sole stylesheet. Its twelve-build matrix covers full/minimal/
site-author metadata at root and `/blog`, in development and production. It
checks page-author precedence, configured site-author fallback and absent
names without inventing attribution. It does not load
the full Pages stack or change the original rendering fixture below.

The fixture explicitly pins `base64` 0.3.0 and `bigdecimal` 4.1.3, needed by
older dependencies on newer Ruby, and `kramdown-parser-gfm` 1.1.0 for Jekyll's
default Markdown input. Install in an isolated user-local bundle, not global
gems. No Ruby installation, actual blog or global gem configuration was changed.

## Scope

- `header.html`: escaped title and optional plain-text description.
- `post-summary.html`: native article, h2, date and tags. Pass a trusted Jekyll
  `post` object. Description is explicitly plain text, never excerpt HTML.
- `relative_url` is used before HTML escaping on internal links and CSS URLs.
  URL inputs are trusted Jekyll-generated paths; this is not a URL sanitizer.
  Do not use these includes with arbitrary external/untrusted URL models.
- CSS is the existing built asset. No Sass/Node runtime, scripts or new palette.
  Global typography styles mean this requires deliberate layout integration,
  not dropping the stylesheet into an existing theme blindly.

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
