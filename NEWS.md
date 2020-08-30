# Release Notes

## 2.3.4 - August 30, 2020

- Fixed a regression in 2.3.0 which caused include paths in the config file to be treated as additional spec paths.
- The TAP reporter now outputs the test plan at the beginning instead of the end, as it should.
- The internal copy of the Jasmine library has been updated to version 2.3.4, which brings in the minor bugfixes from 2.3.1, 2.3.2, and 2.3.3 as well.
- Thanks to Andy Holmes for contributing.

## 2.3.0 - August 25, 2020

- Added a `--debug` command line flag which will run the tests under GDB or the debugger of your choice.
- Added an `--interpreter` command line flag which allows using a different interpreter than whichever copy of `gjs` is in your path.
- Fixed several bugs around the loading of spec files.
- Improved error messages.
- Jasmine GJS now depends on GJS 1.58.0.
- The internal copy of the Jasmine library has been updated to 2.3.0, which brings:
  - `done.fail()` for asynchronous specs.
  - `toContain()` can be used for finding substrings.
  - `toThrow()` can be used to check that a particular value was thrown.
- Thanks to Niv Sardi, Bart Libert and Andy Holmes for contributing.

## 2.2.1 - June 30, 2015

- We now use `/usr/bin/env` to locate jasmine-gjs which allows Jasmine to be used with a development version of GJS. (Thanks to Sam Spilsbury)
- We don't exit with `System.exit()` on success, because that bypasses the GJS interpreter shutdown actions. (Thanks to Sam Spilsbury)
- The internal copy of the Jasmine library has been updated to version 2.2.1, which is a minor bugfix release.

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