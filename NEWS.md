# Release Notes

## 3.10.1 - July 14, 2024

- The internal copy of the Jasmine library has been updaetd to version 3.10.1, which brings:
  - Support for async before/it/after functions (2.7.0)
  - Add `nothing()` matcher (2.8.0)
  - Add `jasmine.arrayWithExactContents()` tester (2.8.0)
  - Support for `jasmine.any(Symbol)` (2.9.0)
  - `jasmine.any(Object)` no longer matches null (3.0)
  - Add `jasmine.truthy()`, `jasmine.falsy()`, `jasmine.empty()`, and `jasmine.notEmpty()` testers (3.1.0)
  - Add `spyOnAllFunctions()` (3.2.0)
  - Add `expectAsync()`, and `toBeResolved()` and `toBeRejected()` matchers (3.2.0)
  - Add `withContext()` for extra debugging information (3.3.0)
  - Add `toBeRejectedWith()` matcher (3.3.0)
  - Support for custom async matchers with `jasmine.addAsyncMatchers()` (3.5.0)
  - Add `jasmine.setDefaultSpyStrategy()` (3.5.0)
  - Add `jasmine.mapContaining()` and `jasmine.setContaining()` tester (3.5.0)
  - Add `toBeTrue()` and `toBeFalse()` matchers (3.5.0)
  - Add `toHaveBeenCalledOnceWith()` matcher (3.6.0)
  - Add `toHaveSize()` matcher (3.6.0)
  - Add `toBePending()` matcher (3.6.0)
  - Add `already` property of async specs (3.8.0)
  - Add `spy.calls.thisFor()` (3.8.0)
  - Add `jasmine.stringContaining()` tester (3.10.0)
  - All other bug fixes and improvements contained in the intervening versions; see Jasmine's release notes
- It is now possible to use Jasmine GJS as a Meson subproject.
- Jasmine GJS now depends on GJS 1.68.0.
- Thanks to Florian Müllner and Martín Abente Lahaye for contributing.

## 2.6.4 - September 13, 2020

- The internal copy of the Jasmine library has been updated to version 2.6.4, which brings:
  - Add `toBeNegativeInfinity()`, `toBePositiveInfinity()`, `toHaveBeenCalledBefore()` matchers
  - Add `spyOnProperty()` for get/set accessors
  - Add support for ES6 sets to `toContain()` and `toEqual()`
  - Bug fixes included in 2.6.0, 2.6.1, 2.6.2, 2.6.3 and 2.6.4
- Thanks to Andy Holmes for contributing.

## 2.5.2 - September 10, 2020

- The internal copy of the Jasmine library has been updated to version 2.5.2, which brings:
  - Add `toBeGreaterThanOrEqual()` and `toBeLessThanOrEqual()` matchers
  - Bug fixes included in 2.5.0, 2.5.1 and 2.5.2
- Thanks to Andy Holmes for contributing.

## 2.4.1 - Sepetember 4, 2020

- The internal copy of the Jasmine library has been updated to version 2.4.1, which brings:
  - Run jasmine's specs in random order
  - Add support for returning run details for reporting randomness
  - Bug fixes included in 2.4.0
- Thanks to Andy Holmes for contributing.

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
