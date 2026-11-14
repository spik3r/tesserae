# Anonymous SEO/feed fixture

This separate fixture exercises the head/post contracts identified in the
[blog gap map](blog-compatibility.md). It loads `jekyll-seo-tag` 2.8.0 and
`jekyll-feed` 0.17.0, matching the inspected Pages 232 lockfile, alongside the
existing pinned rendering subset. By default it does **not** load `github-pages`,
Minima or the rest of the Pages plugins. The opt-in [Pages bundle profile](jekyll-pages-proof.md)
separately checks default plugin activation on Ruby 3.3.11 with the theme disabled.
Neither profile is a real blog migration.

The local templates retain language fallback, SEO/feed tags, title/date/author,
post microformats, schema attributes, content and hidden permalink semantics.
The synthetic post layout uses an explicit page author before a configured
site author, then escapes the selected name. Tesserae owns the
single stylesheet; `.ts-prose` sits on the article-body div, leaving metadata
outside the prose scope. No theme Sass, real posts or site identity are copied.
These are anonymous contract templates, not byte-for-byte blog layouts.

| Case | Full | Minimal |
| --- | --- | --- |
| Language | Index inherits site `en-AU`; post overrides with `en-GB` | HTML falls back to `en`; SEO defaults to `en_US`; feed has no language attribute |
| Date | Site date format `%Y/%m/%d` | Layout default `%b %-d, %Y` |
| Author | Page author overrides the site author in the post, post JSON-LD and feed entry; site author remains on the index SEO and feed root | Absent in post/JSON-LD; feed 0.17.0 emits an empty author name |
| Conditional hooks | Analytics marker in production only; comments marker on posts | Neither marker appears, including in production |
| Route | Jekyll default `/2020/01/02/synthetic-notes.html` | Same default route |

The third case, `site-author`, has the minimal case's language/date/hook values
but supplies a fictional site author. The same name appears in the post
byline, index/post SEO and feed root/entry. This closes a reproduced mismatch:
the previous layout omitted the byline even though the plugins used the site
author. `full` supplies both names to verify page-over-site precedence.

This is a candidate policy for the anonymous fixture, not a decision about
real blog attribution. It tests nonempty scalar names and missing author
fields. Blank strings, author maps/lists and data-file author registries are
outside this proof. No name is guessed when both fields are missing. The real
blog's page-only byline behaviour remains unchanged.

Analytics and comments includes contain inert comments only. They verify the
head/post inclusion conditions, not provider code, network behaviour or further
conditions inside the real includes. There are no executable scripts; the SEO
plugin emits one `application/ld+json` data block per HTML page.

## Reproduce

From the Tesserae checkout, prepare three fresh directories:

```sh
node scripts/jekyll-metadata-fixture.js --scenario full
node scripts/jekyll-metadata-fixture.js --scenario minimal
node scripts/jekyll-metadata-fixture.js --scenario site-author
```

Each command prints a new system-temp directory. No destination option is
accepted. Preparation copies the current CSS and rendering Gemfile, adds the
two exact plugin pins, and writes only fictional scenario data. It does not
build or install dependencies.

In each prepared directory, select an isolated absolute `BUNDLE_PATH` outside
the fixture and an isolated `BUNDLE_USER_HOME`; do not use global gems or a real
blog checkout. Install once per shared private bundle:

```sh
export BUNDLE_PATH=/path/to/private-gems
export BUNDLE_USER_HOME=/path/to/private-bundle-home
export BUNDLE_DISABLE_SHARED_GEMS=true
bundle install
JEKYLL_ENV=development bundle exec jekyll build --baseurl '' --destination _site-root-development
JEKYLL_ENV=production bundle exec jekyll build --baseurl '' --destination _site-root-production
JEKYLL_ENV=development bundle exec jekyll build --baseurl /blog --destination _site-blog-development
JEKYLL_ENV=production bundle exec jekyll build --baseurl /blog --destination _site-blog-production
```

Keep build logs outside fixture sources. From the Tesserae checkout, verify
each output with its matching case, path and environment, for example:

```sh
node scripts/verify-jekyll-metadata.js --directory /path/to/full-fixture/_site-blog-production --scenario full --baseurl /blog --environment production
```

Use `--baseurl ''` for root output, and repeat for all three scenarios and both
environments. The verifier checks exact known-fixture contracts: output routes,
canonical/OG URLs, JSON-LD fields, feed discovery and entries, language/date/
author metadata, microformats, prose boundary, hook gates and CSS bytes. It
rejects extra output files, duplicate stylesheets and executable scripts. It
does not parse arbitrary HTML/XML or validate accessibility or search rankings.

## Evidence and limits

On 14 November 2026, all twelve fresh real builds and output checks passed with
Ruby 4.0.5 / Bundler 4.0.11, Jekyll 3.10.0, Liquid 4.0.4, Kramdown 2.4.0, GFM
parser 1.1.0, Rouge 3.30.0 and the two plugin pins above. The private bundle
also used base64 0.3.0 and bigdecimal 4.1.3; this is not the full blog lockfile
or hosted Pages runtime. This follow-up reused the private bundle frozen;
no gems were installed or changed.

Node tests use recorded output from these builds, with whitespace and the
feed build timestamp normalised, plus deliberate corruptions. CI does not
install Ruby or run Jekyll. The snapshots preserve the plugins' smart quotes,
HTML entities and feed author fallback; they are not an independent feed
standards-conformance test. In particular, a site without author data needs a
separate author policy before publishing an Atom feed.

The original nine-build rendering fixture remains separate and unchanged.
Full Pages plugin activation, real front-matter/routes/content, navigation,
excerpts, theme-specific styles, real analytics/comments and deployment remain
unverified. No browser, preview, visual, print, keyboard or assistive-technology
checks were performed. This fixture provides no approval to change the blog.

The Pages profile now covers local default-plugin activation; hosted runtime
parity and remaining route/layout ownership still need review. The authorless case remains
unsuitable as a publishing example; real author policy and unsupported author
shapes still need review. Retain the real blog's routes and metadata until
their own checks pass.
