EXTRA_DIST =
CLEANFILES =

# Executable

dist_bin_SCRIPTS = bin/jasmine

do_subst = sed \
	-e 's,[@]datadir[@],$(datadir),g' \
	$(NULL)
bin/jasmine: bin/jasmine.in Makefile
	$(AM_V_GEN)$(MKDIR_P) bin && \
	$(do_subst) < $< > $@ && \
	chmod +x $@
EXTRA_DIST += bin/jasmine.in
CLEANFILES += bin/jasmine

# Source code

dist_pkgdata_DATA = \
	src/command.js \
	src/consoleReporter.js \
	src/jasmineBoot.js \
	src/junitReporter.js \
	src/options.js \
	src/tapReporter.js \
	src/timer.js \
	src/utils.js \
	src/verboseReporter.js \
	src/xmlWriter.js \
	$(NULL)

# Jasmine library

dist_pkgdata_DATA += lib/jasmine.js

# The following rule is not meant to be executed as part of the build process.
# It is used to build our custom version of the Jasmine library by downloading
# the upstream file and applying our patches, and is meant for use only when
# upgrading to a new upstream version.
# This rule will explicitly not work if $(srcdir) is not writable.
$(srcdir)/lib/jasmine.js:
	curl -o $@ https://raw.githubusercontent.com/jasmine/jasmine/v2.2.0/lib/jasmine-core/jasmine.js
	patch <$(srcdir)/lib/local-modifications.patch $@
EXTRA_DIST += lib/local-modifications.patch

# Config files

EXTRA_DIST += jasmine.json

# Tests

JS_LOG_DRIVER = env AM_TAP_AWK='$(AWK)' $(SHELL) $(top_srcdir)/tap-driver.sh
JS_LOG_DRIVER_FLAGS = --comments

TESTS = \
	test/commandSpec.js \
	test/consoleReporterSpec.js \
	test/defaultReporterSpec.js \
	test/focusedSpecIntegrationTest.js \
	test/importerSpec.js \
	test/jasmineBootSpec.js \
	test/jasmineIntegrationTest.js \
	test/junitReporterSpec.js \
	test/optionsSpec.js \
	test/tapReporterSpec.js \
	test/timerSpec.js \
	test/utilsSpec.js \
	test/verboseReporterSpec.js \
	test/xmlWriterSpec.js \
	$(NULL)
EXTRA_DIST += $(TESTS)
TEST_EXTENSIONS = .js

## This uses the local, uninstalled copy of Jasmine. If you were going to use
## this in your own package, you would do it like so:
##   JS_LOG_COMPILER = jasmine
JS_LOG_COMPILER = $(builddir)/bin/jasmine
AM_JS_LOG_FLAGS = --tap --no-config
AM_TESTS_ENVIRONMENT = \
	export SRCDIR='$(srcdir)'; \
	export JASMINE_UNINSTALLED=yes; \
	export RUN_THOROUGH_TESTS=yes; \
	$(NULL)

# Test fixtures

EXTRA_DIST += \
	test/fixtures/invalid.json \
	test/fixtures/jasmine.json \
	test/fixtures/notASpec.txt \
	test/fixtures/path.json \
	test/fixtures/someSpec.js \
	test/fixtures/otherSpec.js \
	test/utils.js \
	$(NULL)

# Documentation

dist_man1_MANS = jasmine.man
EXTRA_DIST += README.md NEWS.md

# Git ignore files

MAINTAINERCLEANFILES = $(GITIGNORE_MAINTAINERCLEANFILES_TOPLEVEL) tap-driver.sh

-include $(top_srcdir)/git.mk
