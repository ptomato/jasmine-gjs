[![Build Status](https://travis-ci.org/ptomato/jasmine-gjs.png?branch=master)](https://travis-ci.org/ptomato/jasmine-gjs)

# Jasmine for GJS

[Jasmine](https://github.com/jasmine/jasmine) is a BDD (behavior-driven
development) framework for JavaScript.

## Contents

This module allows you to run Jasmine specs for your GJS code.
The output will be displayed in your terminal.

## Installation

From Git:

```sh
git clone https://github.com/ptomato/jasmine-gjs
cd jasmine-gjs
./autogen.sh
make
sudo make install
```

From a tarball:

```sh
tar xJf jasmine-gjs-2.1.3.tar.xz
cd jasmine-gjs-2.1.3
./configure
make
sudo make install
```

## Usage

To run your test suite, pass its directory to the `jasmine` command:

```bash
jasmine mytestsuitedir
```

To run an individual spec:

```bash
jasmine path/to/spec.js
```

## Options

`--no-color`: Don't output color in the terminal.
(Opposite of `--color`.)

`--exclude <file>`: Don't run specs that match `file` (which may
contain `?` and `*` wildcards.)
This is useful if you pass a directory of specs that also contains
utility modules or specs that you don't want to run by default.
You may specify this option more than once with different arguments.

`--verbose`: Output verbose results, formatted similarly to Mocha's
output.
(The default output is formatted the same as Jasmine's Node.JS runner's
output.)

`--tap`: Output according to the
[Test Anything Protocol](http://testanything.org/).
This is useful when integrating with Automake (see below.)

`--junit [<file>]`: In addition to the console output, print a JUnit-style
XML report to `file`.
If no file is given, the default is `report.xml` in the current working
directory.
If you don't specify an absolute path but you do set the environment variable `JASMINE_JUNIT_REPORTS_DIR`, then the report will be placed there instead.
This allows you to use `$$tst` as the argument to `--junit` in your Makefile to mirror your test directory structure in your report directory.

`--config <file>`: Use `file` as Jasmine's configuration file instead of
the default `jasmine.json`.

`--no-config`: Don't load a configuration file, even if one is present.

## Configuration file

Maybe you don't want to keep typing the same options every time you run
your tests.
In that case, you can create a configuration file called `jasmine.json`.
Jasmine will look for it in the current working directory by default.

If you configure your test suites in the configuration file, then you
can start Jasmine simply by running

```bash
jasmine
```

The file should be a JSON file.
You can use the following keys:

`include_paths`: (string or array of strings)
Prepend these paths to GJS's include paths, in order of priority,
highest first.
(The same as specifying `-I` to GJS or defining the `GJS_PATH`
environment variable.)
Relative paths are resolved relative to the configuration file's
location.

`options`: (string or array of strings)
Use these command-line options for Jasmine by default.
Options given on the command line will override these in the event of a
conflict.

`exclude`: (string or array of strings)
Don't run specs in these files or directories.
They may contain `*` and `?` as wildcards.
(The same as specifying `--exclude` on the command line.)

`spec_files`: (string or array of strings)
Run specs in these files or directories.
The same as specifying files or directories on the command line.
If you specify any on the command line, then this option is entirely
ignored; this is useful for running your entire test suite by default
but retaining the ability to run just one spec file on the command line.
Relative paths are resolved relative to the configuration file's
location.

`environment`: (object with string properties)
Execute specs with a modified environment.
Each property of the given object is added as an environment variable.
If a property's value is `null`, then any existing environment variable
of that name is unset.
This is mainly useful if your Javascript code uses a private C library;
you can add `LD_LIBRARY_PATH` and `GI_TYPELIB_PATH` to `environment` in
order to expose that library to GJS's GObject introspection repository.

## Integration with Autotools

If using autotools, you might want to integrate your test suite into
your makefiles.
The TAP reporter produces output that Automake can parse and display
while the tests are running.
That way, you have more immediate feedback and can see problems directly
from your build output.

Put this code in `configure.ac`:

```
AC_PROG_AWK
AC_REQUIRE_AUX_FILE([tap-driver.sh])
```

Then re-run `autogen.sh` or `autoreconf` to install the TAP driver.

Then, put this code in your `Makefile.am`:

```make
JS_LOG_DRIVER = env AM_TAP_AWK='$(AWK)' $(SHELL) $(top_srcdir)/tap-driver.sh
JS_LOG_DRIVER_FLAGS = --comments

TESTS = path/to/spec1.js path/to/spec2.js
TEST_EXTENSIONS = .js
JS_LOG_COMPILER = jasmine
AM_JS_LOG_FLAGS = --tap --no-config
```

Don't forget to `EXTRA_DIST` your spec files too.
Now Jasmine will run your spec files one by one as part of `make check`.

With this configuration, the TAP driver displays all the extra
diagnostic information about suites starting and finishing, and
expectation messages in case of failure.
If you don't want that, remove the `JS_LOG_DRIVER_FLAGS` line.

### A note on extra files

If you use on-disk test fixtures, you should note that someone may be
building your software with separate source and build trees.
Notably, `make distcheck` does this.
In that case, you have to make sure that your fixtures can be found both
when running tests from the source directory and from a separate build
directory.
I suggest defining an environment variable in your makefile that tells
where the fixtures can be found.
For example, in Jasmine GJS's own tests, this line is in `Makefile.am`:

```make
AM_TESTS_ENVIRONMENT = export SRCDIR='$(srcdir)';
```

The test code then reads the environment variable like this:

```js
let envSrcdir = GLib.getenv('SRCDIR');
const SRCDIR = envSrcdir? envSrcdir + '/' : '';

doSomethingWithFixture(SRCDIR + 'path/to/fixture');
```

## Support

Please file issues here at
[GitHub](https://github.com/ptomato/jasmine-gjs/issues).

## Credits

The idea of Jasmine for GJS was first explored by my coworkers Devin
Ekins and Sam Spilsbury:
[eos-jasmine](https://github.com/endlessm/eos-jasmine).
This code, however, was unashamedly cribbed from Pivotal Labs'
[jasmine-npm](https://github.com/jasmine/jasmine-npm), then expanded
into what it is now.

Copyright (c) 2015 Philip Chimento.
This software is licensed under the MIT License &mdash; because Jasmine
and Jasmine NPM are too.
