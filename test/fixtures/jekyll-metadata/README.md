# Recorded plugin output

These anonymous full/minimal snapshots come from the real production `/blog`
builds described in [the metadata proof](../../../docs/jekyll-metadata-proof.md).
Only trailing whitespace and the feed-level build timestamp were normalised.
Post timestamps, plugin entities, smart quotes and the empty minimal author
remain as emitted by the pinned plugins.

The Node tests copy these snapshots into disposable outputs, substitute the
base path, remove the analytics marker for development, and inject corruptions.
They test the verifier, not Liquid execution. Rebuild both scenarios and run
the eight real output checks when changing templates or plugin pins.
