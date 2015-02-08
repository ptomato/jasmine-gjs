const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const System = imports.system;

const Options = imports.options;
const Timer = imports.timer;

function run(_jasmine, argv) {
    let [files, options] = Options.parseOptions(argv);

    if (options.version) {
        print('Jasmine', _jasmine.version);
        System.exit(0);
    }

    let reporterOptions = {
        onComplete: function (success) {
            if (!success)
                System.exit(1);
            Mainloop.quit('jasmine');
        },
        show_colors: options.color,
        timerFactory: Timer.createDefaultTimer,
    };

    if (options.verbose) {
        const VerboseReporter = imports.verboseReporter;
        _jasmine.addReporter(new VerboseReporter.VerboseReporter(reporterOptions));
    } else if (options.tap) {
        const TapReporter = imports.tapReporter;
        _jasmine.addReporter(new TapReporter.TapReporter(reporterOptions));
    } else {
        _jasmine.configureDefaultReporter(reporterOptions);
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
            System.exit(1);
        }
        return GLib.SOURCE_REMOVE;
    });

    // _jasmine.execute() queues up all the tests and runs them asynchronously.
    Mainloop.run('jasmine');
}
