EXTRA_DIST =
CLEANFILES =

# Executable

dist_bin_SCRIPTS = bin/jasmine

do_subst = sed \
	-e 's,[@]pkgdatadir[@],$(pkgdatadir),g' \
	-e 's,[@]GJS_PATH[@],$(GJS_PATH),g'\
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
	curl -o $@ https://raw.githubusercontent.com/jasmine/jasmine/v2.1.3/lib/jasmine-core/jasmine.js
	patch <$(srcdir)/lib/local-modifications.patch $@
EXTRA_DIST += lib/local-modifications.patch

# Tests

JS_LOG_DRIVER = env AM_TAP_AWK='$(AWK)' $(SHELL) $(top_srcdir)/tap-driver.sh
JS_LOG_DRIVER_FLAGS = --comments

TESTS = \
	test/commandSpec.js \
	test/consoleReporterSpec.js \
	test/defaultReporterSpec.js \
	test/focusedSpecIntegrationTest.js \
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
## this in your own package, you would do it like so and omit the -I flags:
##   JS_LOG_COMPILER = jasmine
##   AM_JS_LOG_FLAGS = --tap
JS_LOG_COMPILER = $(builddir)/bin/jasmine
AM_JS_LOG_FLAGS = -I $(srcdir)/src -I $(srcdir)/lib --tap
AM_TESTS_ENVIRONMENT = export SRCDIR='$(srcdir)'; export RUN_THOROUGH_TESTS=yes;

# Test fixtures

EXTRA_DIST += \
	test/fixtures/notASpec.txt \
	test/fixtures/someSpec.js \
	test/fixtures/otherSpec.js \
	$(NULL)

# Git ignore files

MAINTAINERCLEANFILES = $(GITIGNORE_MAINTAINERCLEANFILES_TOPLEVEL) tap-driver.sh

-include $(top_srcdir)/git.mk
