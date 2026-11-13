# Jekyll adapter: local-only proof

Two experimental Liquid includes and a fictional disposable test site. This is
**not exported or installable**, nor production-ready. React and Solid remain
unimplemented. No blog content, URLs, configuration or deployment is modified.

The intended target's lockfile pins **Jekyll 3.10.0 / Liquid 4.0.4** (GitHub Pages
232). The fixture pins those two versions, not the full Pages plugin stack.
All six synthetic builds have been verified locally with Jekyll 3.10.0,
Liquid 4.0.4 and Ruby 4.0.5: full/minimal/empty at root and
`/synthetic-preview`. Parsed output checks verified escaping, stylesheet URL and
bytes, post permalink/date, absent optional metadata and the no-post message.
This is not verification of the full GitHub Pages plugin stack or actual blog.
Structural Node tests remain separate from those real-build checks.

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
```

Do not infer a successful build from fixture preparation. Check both outputs
for escaped title/description/tag markup, correct `/synthetic-preview/` versus
root links, stylesheet resolution and unchanged post permalink. Repeat both
builds for all three scenarios. The minimal scenario should omit its post
description/tag markup while keeping its article/link/date; the empty scenario
should say “No posts yet.” and contain no post articles. No browser
preview is authorised by this checklist; honour existing preview restrictions.

Independent source review and the six synthetic builds passed. Any later changes
must repeat these checks. Blog integration still needs its own compatibility
review, including Pages plugins, SEO/feed tags, code highlighting and routes.
Keyboard, visual, print and assistive-technology QA remain pending.
