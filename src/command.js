/* global jasmineImporter */
/* exported run */

const Format = imports.format;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const System = imports.system;

const Options = jasmineImporter.options;
const Timer = jasmineImporter.timer;

String.prototype.format = Format.format;

// Make it legal to specify "some_option": "single_value" in the config file as
// well as "some_option": ["multiple", "values"]
function _ensureArray(option) {
    if (!(option instanceof Array))
        return [option];
    return option;
}

function _makePathsAbsolute(configFile, paths) {
    return paths.map((path) => {
        if (GLib.path_is_absolute(path))
            return path;
        return configFile.get_parent().resolve_relative_path(path).get_path();
    });
}

function loadConfig(configFilePath) {
    let configFile = Gio.File.new_for_commandline_arg(configFilePath);
    let config = {};

    try {
        let [, contents] = configFile.load_contents(null);
        if (contents instanceof Uint8Array) {
            contents = imports.byteArray.toString(contents)
        }
        config = JSON.parse(contents);
    } catch (e) {
        throw new Error('Configuration not read from ' + configFile.get_path());
    }

    if (config.include_paths)
        config.include_paths = _makePathsAbsolute(configFile,
            _ensureArray(config.include_paths));
    if (config.spec_files)
        config.spec_files = _makePathsAbsolute(configFile,
            _ensureArray(config.spec_files));

    const RECOGNIZED_KEYS = [
        'environment',
        'exclude',
        'include_paths',
        'options',
        'spec_files',
    ];
    Object.keys(config).forEach((key) => {
        if (RECOGNIZED_KEYS.indexOf(key) === -1)
            printerr('warning: unrecognized config file key "%s"'.format(key));
    });

    print('Configuration loaded from', configFile.get_path());
    return config;
}

function configToArgs(config, shouldAddSpecFiles) {
    let retval = [];
    if (config.include_paths) {
        _ensureArray(config.include_paths).forEach((path) => {
            retval.push('-I');
            retval.push(path);
        });
    }
    if (config.exclude) {
        _ensureArray(config.exclude).forEach((exclude) => {
            retval.push('--exclude');
            retval.push(exclude);
        });
    }
    if (config.options)
        retval = retval.concat(_ensureArray(config.options));
    if (shouldAddSpecFiles && config.spec_files)
        retval = retval.concat(_ensureArray(config.spec_files));
    return retval;
}

function run(_jasmine, argv, config={}, timeout=-1) {
    let [files, options] = Options.parseOptions(argv);

    if (options['no-config'])
        config = {};

    if (options.config)
        config = loadConfig(options.config);

    // If an environment is specified, launch a subprocess of Jasmine with that
    // environment
    if (config.environment) {
        let launcher = new Gio.SubprocessLauncher();
        Object.keys(config.environment).forEach((key) => {
            if (config.environment[key] === null)
                launcher.unsetenv(key);
            else
                launcher.setenv(key, config.environment[key], true);
        });

        let args = argv;
        // The subprocess should ignore the config file, since the config file
        // contains the environment key; we will pass everything it needs to
        // know on the command line.
        args.push('--no-config');
        args = configToArgs(config, files.length === 0).concat(args);
        args.unshift(System.programInvocationName);  // argv[0]

        let process = launcher.spawnv(args);
        process.wait(null);
        if (process.get_if_exited())
            return process.get_exit_status();
        return 1;
    }

    if (config.include_paths) {
        _ensureArray(config.include_paths).reverse().forEach((path) => {
            imports.searchPath.unshift(path);
        });
    }

    if (config.options) {
        let [, configOptions] = Options.parseOptions(_ensureArray(config.options));
        // Command-line options should always override config file options
        Object.keys(configOptions).forEach((key) => {
            if (!(key in options))
                options[key] = configOptions[key];
        });
    }

    if (options.exclude || config.exclude) {
        let optionsExclude = options.exclude || [];
        let configExclude = config.exclude? _ensureArray(config.exclude) : [];
        _jasmine.exclusions = configExclude.concat(optionsExclude);
    }

    // Specific tests given on the command line should always override the
    // default tests in the config file
    if (config.spec_files && files.length === 0)
        files = _ensureArray(config.spec_files);

    if (options.version) {
        print('Jasmine', _jasmine.version);
        return 0;
    }

    if (options.junit) {
        const JUnitReporter = jasmineImporter.junitReporter;

        let junitPath = options.junit;
        if (!GLib.path_is_absolute(junitPath) &&
            GLib.getenv('JASMINE_JUNIT_REPORTS_DIR') !== null)
            junitPath = GLib.getenv('JASMINE_JUNIT_REPORTS_DIR') + '/' +
                junitPath;
        let junitFile = Gio.File.new_for_commandline_arg(junitPath);

        // Since people might want their report dir structure to mirror
        // their test dir structure, we shall be kind and try to create any
        // report directories that don't exist.
        try {
            junitFile.get_parent().make_directory_with_parents(null);
        } catch (e) {
            if (!e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.EXISTS))
                throw e;
            // ignore error if directory already exists
        }

        let rawStream = junitFile.replace(null, false, Gio.FileCreateFlags.NONE, null);
        let junitStream = new Gio.DataOutputStream({
            base_stream: rawStream,
        });

        let junitReporter = new JUnitReporter.JUnitReporter({
            timerFactory: Timer.createDefaultTimer,
            print: function (str) {
                junitStream.put_string(str, null);
            },
        });
        junitReporter.connect('complete', () => junitStream.close(null));
        _jasmine.addReporter(junitReporter);
    }

    let timeoutId;
    let reporterOptions = {
        show_colors: options.color,
        timerFactory: Timer.createDefaultTimer,
    };
    let exitCode = 0;

    let reporter;
    if (options.verbose) {
        const VerboseReporter = jasmineImporter.verboseReporter;
        reporter = new VerboseReporter.VerboseReporter(reporterOptions);
    } else if (options.tap) {
        const TapReporter = jasmineImporter.tapReporter;
        reporter = new TapReporter.TapReporter(reporterOptions);
    } else {
        const ConsoleReporter = jasmineImporter.consoleReporter;
        reporter = new ConsoleReporter.DefaultReporter(reporterOptions);
    }
    reporter.connect('started', () => Mainloop.source_remove(timeoutId));
    reporter.connect('complete', (reporter, success) => {
        if (!success)
            exitCode = 1;
        Mainloop.quit('jasmine');
    });
    _jasmine.addReporter(reporter);

    // This works around a limitation in GJS 1.40 where exceptions occurring
    // during module import are swallowed.
    if (timeout !== -1) {
        timeoutId = Mainloop.timeout_add_seconds(timeout, function () {
            if (options.tap)
                print('Bail out! Test suite failed to start within 10 seconds');
            else
                printerr('Test suite failed to start within 10 seconds');
            exitCode = 1;
            Mainloop.quit('jasmine');
        });
    }

    // This should start after the main loop starts, otherwise we will hit
    // Mainloop.run() only after several tests have already run. For consistency
    // we should guarantee that there is a main loop running during the tests.
    Mainloop.idle_add(function () {
        try {
            _jasmine.execute(files);
        } catch (e) {
            if (options.tap) {
                // "Bail out!" has a special meaning to TAP harnesses
                print('Bail out! Exception occurred inside Jasmine:', e);
            } else {
                printerr('Exception occurred inside Jasmine:');
                printerr(e);
                printerr(e.stack);
            }
            exitCode = 1;
            Mainloop.quit('jasmine');
        }
        return GLib.SOURCE_REMOVE;
    });

    // _jasmine.execute() queues up all the tests and runs them asynchronously.
    Mainloop.run('jasmine');
    return exitCode;
}
