/* global jasmineImporter */
/* exported run */

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;

const Options = jasmineImporter.options;
const Timer = jasmineImporter.timer;

function run(_jasmine, argv, timeout = -1) {
    let [files, options] = Options.parseOptions(argv);

    if (options.exclude)
        _jasmine.exclusions = options.exclude;

    if (options.junit) {
        const JUnitReporter = jasmineImporter.junitReporter;

        let junitPath = options.junit;
        if (!GLib.path_is_absolute(junitPath) &&
            GLib.getenv('JASMINE_JUNIT_REPORTS_DIR') !== null)
            junitPath = `${GLib.getenv('JASMINE_JUNIT_REPORTS_DIR')}/${junitPath}`;
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
            print(str) {
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
