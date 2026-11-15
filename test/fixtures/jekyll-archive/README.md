# Recorded archive output

These six archive pages were built with the existing pinned subset profile in
production at `/blog`. Only trailing whitespace and EOF were normalized.
Both subset and Pages profiles matched these pages at root and `/blog` after
base-path normalization. See `docs/jekyll-archive-proof.md` for actual build evidence.

Node tests reconstruct only archive pages plus destination inventory stubs and
the current CSS/image. They test output contracts and deliberate corruptions;
they do not run Liquid/Ruby or prove rendering of stubbed destinations, browser
behaviour, HTML sanitization, hosted Pages or real-blog compatibility.
