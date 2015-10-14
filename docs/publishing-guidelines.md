# Publishing guidelines

Builders and importers can be distributed as plugins via NPM.

## Builders

- must be named `exhibit-builder-NAME`, where `NAME` is a good descriptive name matching `/^[a-z]([a-z]|(-(?!-)))+[a-z]$/` (e.g. `foo`, `foo-bar`, etc.)
- must export an outer function which *returns* the actual builder function (or array of builder functions to add in a sequence).
  - the outer function may take arguments as configuration. Any extra arguments passed to `use()` will be passed into your builder.
  - the returned builder function should be named with a camelCased version of the plugin name, optionally with `exhibit` as the first word. For example `foo-bar` becomes `exhibitFooBar`. This naming helps with logging.
    - In the case of multiple functions, add a number to each name, e.g. `function exhibitFooBar0()) {}`, `function () exhibitFooBar1() {}`

## Importers

> This section is a placeholder for now.
