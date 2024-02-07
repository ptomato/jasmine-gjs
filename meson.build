project('jasmine-gjs', version: '3.10.1', license: 'MIT',
    meson_version: '>= 0.58.0')

gjs_dep = dependency('gjs-1.0', required: false)
if gjs_dep.found()
    gjs = find_program(gjs_dep.get_variable('gjs_console'))
else
    gjs = find_program('gjs', 'gjs-console')
endif

pkglibexecdir = join_paths(get_option('libexecdir'), meson.project_name())
pkgdatadir = join_paths(get_option('datadir'), meson.project_name())
jasmine_mod = meson.project_name()

# Executables

config = configuration_data()
config.set('pkgdatadir', join_paths(get_option('prefix'), pkgdatadir))
config.set('pkglibexecdir', join_paths(get_option('prefix'), pkglibexecdir))
config.set('jasmine_mod', jasmine_mod)
config.set('PACKAGE_VERSION', meson.project_version())

jasmine = configure_file(configuration: config, input: 'bin/jasmine.in',
    output: 'jasmine', install: true, install_dir: 'bin')

jasmine_runner = configure_file(configuration: config,
    input: 'bin/jasmine-runner.in', output: 'jasmine-runner', install: true,
    install_dir: pkglibexecdir)

meson.override_find_program('jasmine', jasmine)

# Source code and Jasmine library

install_data(
    'lib/jasmine.js',
    'src/command.js',
    'src/config.js',
    'src/consoleReporter.js',
    'src/jasmineBoot.js',
    'src/junitReporter.js',
    'src/options.js',
    'src/tapReporter.js',
    'src/timer.js',
    'src/utils.js',
    'src/verboseReporter.js',
    'src/xmlWriter.js',
    install_dir: pkgdatadir,
)

# Documentation

install_data('jasmine.man', rename: 'jasmine.1',
    install_dir: join_paths(get_option('datadir'), 'man', 'man1'))

# Tests

tests = [
    'commandSpec',
    'configSpec',
    'consoleReporterSpec',
    'defaultReporterSpec',
    'focusedSpecIntegrationTest',
    'importerSpec',
    'jasmineBootSpec',
    'jasmineIntegrationTest',
    'junitReporterSpec',
    'optionsSpec',
    'tapReporterSpec',
    'timerSpec',
    'utilsSpec',
    'verboseReporterSpec',
    'xmlWriterSpec',
]
test_env = environment()
test_env.set('SRCDIR', meson.current_source_dir())
test_env.set('BUILDDIR', meson.current_build_dir())
test_env.set('JASMINE_UNINSTALLED', 'yes')
foreach t : tests
    test_file = files('test/@0@.js'.format(t))
    test(t, gjs, args: ['-m', jasmine, test_file, '--module', '--tap', '--no-config'],
        env: test_env, protocol: 'tap')
endforeach
