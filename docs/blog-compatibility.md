# Blog compatibility assessment

Assessed on 14 November 2026 against `spik3r/blog` main at
`fd83f4c73f075c83cb72c0989130cd3cc6bb9d95`, with Tesserae based on
`bdbfe19d813de721a58e0e3b76772ee514af1020` (merged prose PR #10).
This is a synthetic rendering-subset assessment, **not approval to migrate the blog**.
Blog files, content, routes, configuration and dependencies were not changed.
No real posts or site identity data were copied into fixtures.

Follow-up based on merged PR #11 (`90dbcabe92084a47cefd658c093062536c8bf0a1`):
the separate [anonymous SEO/feed proof](jekyll-metadata-proof.md) passed eight
builds with the two pinned plugins and head/post contracts. The original
rendering-subset evidence below remains valid; full Pages/blog compatibility
is still unverified.

## Inspected ownership and pins

The blog's [Gemfile](https://github.com/spik3r/blog/blob/fd83f4c73f075c83cb72c0989130cd3cc6bb9d95/Gemfile)
loads `github-pages` in the `jekyll_plugins` group and declares Minima and
Hacker theme dependencies. Its [lockfile](https://github.com/spik3r/blog/blob/fd83f4c73f075c83cb72c0989130cd3cc6bb9d95/Gemfile.lock)
resolves Pages 232, Jekyll 3.10.0, Liquid 4.0.4, Minima 2.5.1,
Kramdown 2.4.0, GFM parser 1.1.0 and Rouge 3.30.0. The lock also includes
SEO tag 2.8.0, feed 0.17.0 and the broader Pages dependency set; installed
dependencies alone do not establish which hooks a build exercises.

The [site configuration](https://github.com/spik3r/blog/blob/fd83f4c73f075c83cb72c0989130cd3cc6bb9d95/_config.yml)
selects `theme: minima` and `baseurl: /blog`, with no explicit plugin list,
Markdown/highlighter choice or permalink override. The repository owns
`_layouts/{default,home,page,post}.html`, its head/header/footer includes,
`assets/main.scss` and `_sass/custom.scss`; a gem-theme switch would not
replace those local templates automatically.

## Gap map

| Area | Blog contract at the inspected revision | Current Tesserae evidence and remaining check |
| --- | --- | --- |
| Rendering versions | Jekyll 3.10.0, Liquid 4.0.4, Kramdown 2.4.0, GFM 1.1.0, Rouge 3.30.0 | These five fixture versions now match. Previously Kramdown was unpinned and the tested bundle used 2.5.2. Nine synthetic builds pass with the pinned subset. |
| Pages/plugins | Pages 232 and its plugin dependency set | The original fixture loads no Pages plugins. The separate metadata fixture loads SEO 2.8.0 and feed 0.17.0 explicitly and verifies their generated metadata/feed. Pages, Minima, other plugins and hosted behaviour remain unverified. |
| Ruby/transitives | Lock records Bundler 2.6.3, base64 0.2.0 and bigdecimal 3.1.9; inspected files do not pin Ruby | Local proof uses Ruby 4.0.5 / Bundler 4.0.11 and compatibility helpers base64 0.3.0 / bigdecimal 4.1.3. This is not a reproduction of the entire lockfile or deployment runtime. |
| Base path | `/blog`; links and stylesheet use `relative_url` | Full/minimal/empty fixtures pass at root, `/synthetic-preview` and `/blog`. Verifier rejects missing/doubled `/blog` prefixes. This tests path composition, not real routes. |
| Routes | No config-level permalink override; Jekyll 3.10 defaults to the `date` style | Original fixture retains `/notes/:year/:month/:day/:title/`. Metadata fixture verifies the default synthetic `.html` route at root and `/blog`. Actual post/front-matter routes remain uninventoried and unchanged. |
| Document/head | Local default chooses page/site language; local head invokes `seo` and `feed_meta`, plus conditional production analytics | Metadata fixture verifies page/site/default language, canonical/OG/JSON-LD/feed output and inert analytics inclusion markers in development/production. Actual provider code and full blog head remain unverified. |
| Post semantics | Local post owns title, configurable date format, optional author, `h-entry`/`p-name`/`dt-published`/`e-content`/`u-url`, schema attributes and conditional comments | Metadata fixture retains and verifies these contracts with `.ts-prose` on the body div and inert comment markers. It is not the real layout. Minimal feed output exposes feed 0.17.0's empty-author fallback; publication needs an author policy. |
| Home/navigation/footer | Local home uses h2/h3 post hierarchy, date format and optional rich excerpts; local header/footer own page links and navigation/social markup | The summary include supports h2/h3 but takes plain-text description, not excerpt HTML. Navigation, excerpt handling, footer structure and interactive menu behaviour are not covered. |
| Stylesheet ownership | `assets/main.scss` imports Minima and custom Sass; custom rules size footer columns | Metadata fixture uses only the exact Tesserae CSS asset and rejects extra stylesheets. Loading both theme stylesheets or replacing the real blog's required styles remains unqualified. |
| Content/highlighting | Pinned Kramdown/GFM/Rouge pipeline | Synthetic headings, nested lists, quote, literal code and fragment link pass. Real content, images, tables, coloured code tokens and plugin syntax remain outside this proof. |
| Presentation | Existing blog's screen, navigation and print behaviour | No browser, preview, keyboard, visual/print or assistive-technology QA was performed. Existing denied-preview restrictions remain in force. |

Layout evidence: [default](https://github.com/spik3r/blog/blob/fd83f4c73f075c83cb72c0989130cd3cc6bb9d95/_layouts/default.html),
[head](https://github.com/spik3r/blog/blob/fd83f4c73f075c83cb72c0989130cd3cc6bb9d95/_includes/head.html),
[post](https://github.com/spik3r/blog/blob/fd83f4c73f075c83cb72c0989130cd3cc6bb9d95/_layouts/post.html),
[home](https://github.com/spik3r/blog/blob/fd83f4c73f075c83cb72c0989130cd3cc6bb9d95/_layouts/home.html),
[stylesheet entry](https://github.com/spik3r/blog/blob/fd83f4c73f075c83cb72c0989130cd3cc6bb9d95/assets/main.scss).

## Reproduce the bounded proof

Follow [fixture preparation](../jekyll/README.md#prepare-an-isolated-fixture).
Install its Gemfile into an isolated `BUNDLE_PATH`, then check the selected
versions before building; existing bundles must resolve the new exact pins.
Do not run these commands in a real blog checkout.

For each fresh `full`, `minimal` and `empty` fixture:

```sh
bundle exec jekyll build --baseurl '' --destination _site-root
bundle exec jekyll build --baseurl /synthetic-preview --destination _site-preview
bundle exec jekyll build --baseurl /blog --destination _site-blog
```

Run `scripts/verify-jekyll.js` from the Tesserae checkout for each output, with
its matching scenario/baseurl. All nine builds and output checks passed with
the versions above. Node CI exercises the verifier using hand-authored output
and negative cases; it does not install Ruby or claim to run these real builds.

The separate metadata fixture now covers the two pinned SEO/feed plugins,
default synthetic routes and head/post contracts under one stylesheet owner.
Next gates remain the full Pages/runtime stack, feed author policy and the
unverified real route/layout contracts. Framework ports do not resolve these
consumer-specific gaps.
