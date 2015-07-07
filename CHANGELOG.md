# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased][unreleased]
### Added
- New 'loaders' system to replace `loadPaths`. String load paths can still be provided, but these automatically get turned into `genericLoader` functions. Plus loaders for Bower, JSPM and Component are automatically added if corresponding files (`bower.json` etc.) are detected in the CWD. Also, loaders are a new type of plugin. The other, original plugin type is 'builders'.


<!-- EXAMPLE:
## [0.0.8] - 2015-02-17
### Changed
- Update year to match in every README example.

### Fixed
- Fix typos in recent README changes.
- Update outdated unreleased diff link.
 -->

[unreleased]: https://github.com/exhibitjs/exhibit/compare/v0.1.0...HEAD
