# Run through bundle exec from a newly prepared anonymous Pages fixture.
# This initializes Jekyll's plugins but does not build, install or deploy a site.
require "json"

abort "Expected an anonymous --stack pages fixture" unless
  File.file?(".tesserae-pages-fixture") && File.read(".tesserae-pages-fixture") == "v1\n"

require "jekyll"
Jekyll::PluginManager.require_from_bundler
abort "Pages was not loaded from the Gemfile plugin group" unless defined?(GitHubPages)
abort "Expected github-pages 232" unless GitHubPages::VERSION.to_s == "232"

site = Jekyll::Site.new(Jekyll.configuration)
abort "Pages configuration hook did not run" unless GitHubPages::Configuration.processed?(site)
abort "Expected theme: null and safe mode" unless site.config["theme"].nil? && site.config["safe"] == true
abort "Expected the fictional repository" unless site.config["repository"] == "fictional/fixture"

expected = (GitHubPages::Plugins::DEFAULT_PLUGINS + %w[jekyll-seo-tag jekyll-feed]).sort
abort "Unexpected plugin configuration" unless site.config["plugins"].sort == expected
expected.each do |name|
  # Bundler resolves every dependency; loaded source files establish activation.
  gem_path = "#{Gem.loaded_specs.fetch(name).full_gem_path}/"
  loaded = $LOADED_FEATURES.any? { |path| path.start_with?(gem_path) }
  abort "Plugin source was not loaded: #{name}" unless loaded
end

names = %w[github-pages jekyll liquid kramdown kramdown-parser-gfm rouge commonmarker] + expected
versions = names.uniq.sort.to_h { |name| [name, Gem.loaded_specs.fetch(name).version.to_s] }
puts JSON.pretty_generate(
  "ruby" => RUBY_VERSION,
  "bundler" => Bundler::VERSION,
  "environment" => Jekyll.env,
  "safe" => site.config["safe"],
  "theme" => site.config["theme"],
  "plugins" => expected,
  "versions" => versions
)
