# Jekyll adapter: local-only proof

Two experimental Liquid includes and a fictional disposable test site. This is
**not exported or installable**, nor production-ready. React and Solid remain
unimplemented. No blog content, URLs, configuration or deployment is modified.

The intended target's lockfile pins **Jekyll 3.10.0 / Liquid 4.0.4** (GitHub Pages
232). The fixture pins those two versions, not the full Pages plugin stack.
Actual Jekyll rendering has **not been verified**: neither available Ruby
installation currently has these gems. Structural Node tests are not a substitute.

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
accepted. The preparation tests check fixture contents, not Liquid execution.

Once the pinned gems are available, from that temporary directory:

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

Independent review and actual Jekyll builds are required before integrating or
publishing. Keyboard, visual, print and assistive-technology QA remain pending.
