# Release Notes

## 2.2.0 - May 17, 2015

- You can now specify file patterns to exclude using the `--exclude`
  command line option.
  Previously you could only do this via the config file.
- You can now set environment variables in the config file using the
  `"environment"` key.
- When you specify a directory for JUnit reports to be placed in, that
  directory will now be created if it doesn't already exist.
- If the argument to `--junit` is not an absolute path, then the path
  will be resolved relative to the current directory.
  However, you can now resolve it relative to a different path by
  setting the environment variable `JASMINE_JUNIT_REPORTS_DIR`.
- The verbose and TAP reporters now report the reason why a spec has
  been marked pending, if any reason has been given.
- The internal copy of the Jasmine library has been updated to version
  2.2.0, including the following features:
  - the `toThrowError()` matcher to expect a particular exception
  - the `jasmine.anything()` object to match anything
  - the `jasmine.arrayContaining()` object to match an array containing
    all of the given objects
  - the `jasmine.stringMatching()` object to match a string that matches
    the given regular expression or substring
  - custom matching objects with `asymmetricMatch` methods
  - per-spec timeouts with an extra argument to `it()`, `beforeEach()`,
    and `afterEach()`

## 2.1.3 - March 4, 2015

- Initial release.