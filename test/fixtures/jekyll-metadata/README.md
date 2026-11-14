# Recorded plugin output

These anonymous full/minimal/site-author/permalink snapshots come from real production `/blog`
builds described in [the metadata proof](../../../docs/jekyll-metadata-proof.md).
Only trailing whitespace and the feed-level build timestamp were normalised.
Post timestamps, plugin entities, smart quotes and the empty minimal author
remain as emitted by the pinned plugins.

The Node tests copy these snapshots into disposable outputs, substitute the
base path, remove the analytics marker for development, and inject corruptions.
They test the verifier, not Liquid execution. Rebuild all four scenarios and
run the sixteen real output checks per bundle when changing templates or plugin pins.
The permalink case's Atom ID differs from its canonical URL; do not normalize
one into the other. Both the subset and Pages bundle outputs match these snapshots.
