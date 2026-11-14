# Anonymous Pages bundle proof

The metadata fixture has an opt-in `--stack pages` profile. It adds
`github-pages` 232 in the `jekyll_plugins` Gemfile group, disables the default
theme with `theme: null`, and supplies the fictional repository `fictional/fixture`.
Tesserae remains the sole stylesheet owner. The existing `subset` default and
all three metadata scenarios remain available.

This tests Pages' default plugin activation plus the explicit SEO/feed plugins
against anonymous local layouts. It does not test every permitted plugin,
Minima layouts, the real blog, or the hosted Pages runtime.

## Runtime qualification

The first install attempt on Ruby 4.0.5 failed before any build. Pages 232 pins
`jekyll-commonmark-ghpages` 0.5.1, which depends on `jekyll-commonmark` 1.4.x and
CommonMarker `~> 0.22`. [CommonMarker 0.23.12 requires Ruby below 4.0](https://github.com/gjtorikian/commonmarker/blob/v0.23.12/commonmarker.gemspec).
The earlier Ruby 4 rendering/SEO/feed subset proof therefore does not establish
Pages bundle compatibility.

An existing Ruby **3.3.11** with Bundler **4.0.11** resolved the Pages bundle in a
new private `BUNDLE_PATH`: 99 gems, about 92 MiB. No Ruby was installed or
switched globally. The resolved CommonMarker was 0.23.12; the existing Jekyll
3.10.0, Liquid 4.0.4, Kramdown 2.4.0, GFM 1.1.0 and Rouge 3.30.0 pins remained.
Transitive versions were resolved afresh, not copied from the real blog's
entire lockfile. This is evidence for that local runtime, not every Ruby 3 release.

## Prepare and check

From the Tesserae checkout:

```sh
node scripts/jekyll-metadata-fixture.js --scenario full --stack pages
node scripts/jekyll-metadata-fixture.js --scenario minimal --stack pages
node scripts/jekyll-metadata-fixture.js --scenario site-author --stack pages
```

Each command creates a new disposable directory. No destination option is
accepted; preparation does not install gems or build. Use a compatible Ruby
on a task-local `PATH` and a private bundle outside those fixture directories:

```sh
export BUNDLE_PATH=/path/to/private-pages-gems
export BUNDLE_USER_HOME=/path/to/private-pages-bundle-home
export BUNDLE_DISABLE_SHARED_GEMS=true
export NO_NETRC=true
bundle install
```

Run this from each prepared directory. Keep logs outside fixture sources. For
the anonymous proof, use a credential-free environment without inherited
`PAGES_REPO_NWO`, `JEKYLL_GITHUB_TOKEN` or `OCTOKIT_ACCESS_TOKEN` values.

Before building, check runtime activation in both environments, substituting
the absolute Tesserae checkout path:

```sh
JEKYLL_ENV=development bundle exec ruby /path/to/tesserae/scripts/check-jekyll-pages.rb
JEKYLL_ENV=production bundle exec ruby /path/to/tesserae/scripts/check-jekyll-pages.rb
```

The check requires the preparation marker, Pages 232 loaded through Bundler's
plugin group, its configuration hook, safe mode, no theme and the exact expected
plugin list. It also checks loaded source paths for each plugin; a resolved gem
alone is not evidence that it ran. It reports runtime and plugin versions but
does not build, install or deploy. Missing markers, a wrong plugin group and an
enabled theme were each tested and rejected.

Build root and `/blog` outputs in development and production, then run the
existing [metadata output verifier](jekyll-metadata-proof.md#reproduce) with
the matching scenario, baseurl and environment. For example:

```sh
JEKYLL_ENV=production bundle exec jekyll build --verbose --baseurl /blog --destination _site-blog-production
```

From the Tesserae checkout:

```sh
node scripts/verify-jekyll-metadata.js --directory /path/to/full-fixture/_site-blog-production --scenario full --baseurl /blog --environment production
```

The output verifier alone cannot identify the bundle that produced identical
HTML. Keep the runtime check and real build as separate required steps.

## Evidence and remaining gates

On 14 November 2026, twelve Pages-backed builds/output checks and six runtime
activation checks passed: full/minimal/site-author at root and `/blog`, in
development and production. All nine production snapshots matched the existing
subset snapshots after the documented whitespace/feed timestamp normalization.
No new golden output was needed. Node CI tests preparation and recorded-output
contracts; it does not install Ruby or run this Pages matrix.

The active set is the ten [Pages 232 default plugins](https://github.com/github/pages-gem/blob/v232/lib/github-pages/plugins.rb)
plus SEO 2.8.0 and feed 0.17.0. The checker reports their names and versions.
Loading a plugin does not exercise every feature: remote GitHub metadata, gist
retrieval, pagination, relative-link transformations and alternate Markdown
rendering are not qualified by this small fixture. The build emitted a warning
about optional Faraday retry middleware; remote API behaviour was not tested.

Hosted build parity, the real blog's lockfile/runtime, Minima/template/Sass
ownership, real routes/content/attribution and other permitted plugins remain
separate gates. The authorless feed still emits an empty name. No browser,
preview, print, visual, keyboard or assistive-technology checks were performed.
No real blog or Foundry files were changed, and nothing was deployed.
