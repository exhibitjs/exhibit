# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [0.8.0] - 2016-03-21

#### Changed
- Everything – complete redesign. Exhibit is now a just library of composable functions.

## [0.7.0] - 2015-10-18
#### Changed
- Various subtle API changes for builders.

## [0.6.0] - 2015-10-15
#### Added
- Generator support: builders can now be provided as generator functions, in which case they are automatically wrapped as [Bluebird coroutines](https://github.com/petkaantonov/bluebird/blob/master/API.md#generators).

#### Changed
- New API for builders: no more `this`; and builders now take a single argument – a 'job' containing data about what needs building. And file paths now have the property name `file`, not `path` (to avoid clashing with Node's path module).
- Better readme.


## [0.5.0] - 2015-10-06
#### Changed
- Builder plugins are now `exhibit-builder-*`
- Fledgling docs
- Restructured: no more multiform; now requiring Node 4+


## [0.4.0] - 2015-07-08
#### Changed
- Builder import API updated: now separate methods for internal, external, multiple, and combinations. Old `import()` is equivalent to the new `importFirst()`. New `import()` is now single-path only.


## [0.3.0] - 2015-07-08
#### Added
- New type of plugin: importers.
- Bower components now resolved automatically with bundled exhibit-bower importer.
- This changelog.


<!-- EXAMPLE:
## [0.0.8] - 2015-02-17
### Changed
- Update year to match in every README example.

### Fixed
- Fix typos in recent README changes.
- Update outdated unreleased diff link.
 -->


[unreleased]: https://github.com/exhibitjs/exhibit/compare/v0.7.0...HEAD
[0.6.0]: https://github.com/exhibitjs/exhibit/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/exhibitjs/exhibit/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/exhibitjs/exhibit/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/exhibitjs/exhibit/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/exhibitjs/exhibit/compare/v0.1.0...v0.3.0
