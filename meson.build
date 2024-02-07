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

uninstalled_pkglibexecdir = meson.current_build_dir()
uninstalled_pkgdatadir = join_paths(meson.current_source_dir(), 'src')
uninstalled_jasmine_mod = 'lib'

# Executables

config = configuration_data()
if meson.is_subproject()
    config.set('pkgdatadir', uninstalled_pkgdatadir)
    config.set('pkglibexecdir', uninstalled_pkglibexecdir)
    config.set('jasmine_mod', uninstalled_jasmine_mod)
else
    config.set('pkgdatadir', join_paths(get_option('prefix'), pkgdatadir))
    config.set('pkglibexecdir', join_paths(get_option('prefix'), pkglibexecdir))
    config.set('jasmine_mod', jasmine_mod)
endif
config.set('PACKAGE_VERSION', meson.project_version())

jasmine = configure_file(configuration: config, input: 'bin/jasmine.in',
    output: 'jasmine', install: not meson.is_subproject(), install_dir: 'bin')

jasmine_runner = configure_file(configuration: config,
    input: 'bin/jasmine-runner.in', output: 'jasmine-runner',
    install: not meson.is_subproject(),
    install_dir: pkglibexecdir)

meson.override_find_program('jasmine', jasmine)

# Source code and Jasmine library

if not meson.is_subproject()
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
endif

# Documentation

if not meson.is_subproject()
    install_data('jasmine.man', rename: 'jasmine.1',
        install_dir: join_paths(get_option('datadir'), 'man', 'man1'))
endif

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
if not meson.is_subproject()
    test_env = environment()
    test_env.set('TEST_PKGDATADIR', uninstalled_pkgdatadir)
    test_env.set('TEST_PKGLIBEXECDIR', uninstalled_pkglibexecdir)
    test_env.set('TEST_JASMINE_MOD', uninstalled_jasmine_mod)
    foreach t : tests
        test_file = files('test/@0@.js'.format(t))
        test(t, gjs, args: ['-m', jasmine, test_file, '--module', '--tap', '--no-config'],
            env: test_env, protocol: 'tap')
    endforeach
endif
