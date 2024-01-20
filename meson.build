project('jasmine-gjs', version: '3.10.1', license: 'MIT',
    meson_version: '>= 0.50.0')

gjs_dep = dependency('gjs-1.0', required: false)
if gjs_dep.found()
    gjs = find_program(gjs_dep.get_pkgconfig_variable('gjs_console'))
else
    gjs = find_program('gjs', 'gjs-console')
endif

pkglibexecdir = join_paths(get_option('libexecdir'), meson.project_name())

# Executables

config = configuration_data()
config.set('datadir', join_paths(get_option('prefix'), get_option('datadir')))
config.set('pkglibexecdir', join_paths(get_option('prefix'), pkglibexecdir))
config.set('PACKAGE_VERSION', meson.project_version())

jasmine = configure_file(configuration: config, input: 'bin/jasmine.in',
    output: 'jasmine', install: true, install_dir: 'bin')

jasmine_runner = configure_file(configuration: config,
    input: 'bin/jasmine-runner.in', output: 'jasmine-runner', install: true,
    install_dir: pkglibexecdir)

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
    test(t, gjs, args: ['-m', 'jasmine', test_file, '--tap', '--no-config'],
        env: test_env, protocol: 'tap')
endforeach
