# Recorded anonymous article output

Thirteen HTML/XML files from actual subset production `/blog` builds: sequence,
single and empty. Pages outputs match these after the same normalization.
Only trailing whitespace/EOF and the first feed-level build timestamp are
normalized. Post dates, SEO/feed entities, content and route spelling remain
as emitted. CSS and the local image are copied from current source by tests.

Node tests derive root URLs and development hook absence from these recordings;
they do not execute Liquid or Ruby. See `docs/jekyll-article-proof.md` for actual
build coverage and separate limitations. Rebuild and reverify when templates,
fixture input, includes or pinned runtime dependencies change.
