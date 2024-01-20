/* global jasmineImporter */

const {Gio, GLib} = imports.gi;

const Command = jasmineImporter.command;
const JUnitReporter = jasmineImporter.junitReporter;
const TapReporter = jasmineImporter.tapReporter;
const VerboseReporter = jasmineImporter.verboseReporter;

const {mainloop} = Command;

describe('Jasmine command', function () {
    let fakeJasmine;

    beforeAll(function () {
        Gio._promisify(Gio._LocalFilePrototype, 'delete_async', 'delete_finish');
    });

    beforeEach(function () {
        fakeJasmine = jasmine.createSpyObj('jasmine', ['addReporter', 'configureDefaultReporter', 'execute']);
        spyOn(mainloop, 'run');  // stub out system behaviour
    });

    describe('running specs', function () {
        it('shows colors by default', function () {
            Command.run(fakeJasmine, []);
            expect(fakeJasmine.addReporter)
                .toHaveBeenCalledWith(jasmine.objectContaining({show_colors: true}));
        });

        it('allows colors to be turned off', function () {
            Command.run(fakeJasmine, ['--no-color']);
            expect(fakeJasmine.addReporter)
                .toHaveBeenCalledWith(jasmine.objectContaining({show_colors: false}));
        });

        it('lets later color arguments override earlier ones', function () {
            Command.run(fakeJasmine, ['--color', '--no-color']);
            expect(fakeJasmine.addReporter)
                .toHaveBeenCalledWith(jasmine.objectContaining({show_colors: false}));
            Command.run(fakeJasmine, ['--no-color', '--color']);
            expect(fakeJasmine.addReporter)
                .toHaveBeenCalledWith(jasmine.objectContaining({show_colors: true}));
        });

        it('loads the verbose reporter', function () {
            Command.run(fakeJasmine, ['--verbose']);
            expect(fakeJasmine.addReporter).toHaveBeenCalled();
            const [reporter] = fakeJasmine.addReporter.calls.argsFor(0);
            expect(reporter.constructor).toBe(VerboseReporter.VerboseReporter);
        });

        it('loads the TAP reporter', function () {
            Command.run(fakeJasmine, ['--tap']);
            expect(fakeJasmine.addReporter).toHaveBeenCalled();
            const [reporter] = fakeJasmine.addReporter.calls.argsFor(0);
            expect(reporter.constructor).toBe(TapReporter.TapReporter);
        });

        it('loads the JUnit reporter alongside the usual reporter', function () {
            // Unfortunately /dev/null can't be opened as a GFile, so we need to
            // write to a temporary file.
            const [tmpFile, stream] = Gio.File.new_tmp('junitreportXXXXXX');
            const tmpPath = tmpFile.get_path();
            stream.close(null);

            Command.run(fakeJasmine, ['--junit', tmpPath]);
            expect(fakeJasmine.addReporter.calls.count()).toBe(2);
            const reporters = fakeJasmine.addReporter.calls.allArgs().map(args => args[0].constructor);
            expect(reporters).toContain(JUnitReporter.JUnitReporter);

            tmpFile.delete_async(GLib.PRIORITY_DEFAULT, null).then(() => {});
        });

        it('creates a directory for the report if necessary', function () {
            const tmpDir = GLib.dir_make_tmp('junitreportXXXXXX');
            const tmpFile =
                Gio.File.new_for_path(tmpDir).get_child('dir').get_child('report.xml');
            const tmpPath = tmpFile.get_path();

            Command.run(fakeJasmine, ['--junit', tmpPath]);
            expect(tmpFile.query_exists(null)).toBeTruthy();

            tmpFile.delete_async(GLib.PRIORITY_DEFAULT, null)
                .then(() => tmpFile.get_parent().delete_async(GLib.PRIORITY_DEFAULT, null))
                .then(() => tmpFile.get_parent().get_parent().delete_async(GLib.PRIORITY_DEFAULT, null));
        });

        it('uses the value of JASMINE_JUNIT_REPORTS_DIR', function () {
            const oldPath = GLib.getenv('JASMINE_JUNIT_REPORTS_DIR');
            const tmpDir = GLib.dir_make_tmp('junitreportXXXXXX');
            GLib.setenv('JASMINE_JUNIT_REPORTS_DIR', tmpDir, true);

            Command.run(fakeJasmine, ['--junit', 'report.xml']);
            const reportFile =
                Gio.File.new_for_path(tmpDir).get_child('report.xml');
            expect(reportFile.query_exists(null)).toBeTruthy();

            reportFile.delete_async(GLib.PRIORITY_DEFAULT, null)
                .then(() => reportFile.get_parent().delete_async(GLib.PRIORITY_DEFAULT, null));

            if (oldPath !== null)
                GLib.setenv('JASMINE_JUNIT_REPORTS_DIR', oldPath, true);
            else
                GLib.unsetenv('JASMINE_JUNIT_REPORTS_DIR');
        });

        it('executes the Jasmine suite', function (done) {
            expect(Command.run(fakeJasmine, [])).toEqual(0);
            // fakeJasmine.execute() is started in idle
            GLib.idle_add(GLib.PRIORITY_DEFAULT, function () {
                expect(fakeJasmine.execute).toHaveBeenCalled();
                done();
            });
        });

        it('runs the specified specs', function (done) {
            Command.run(fakeJasmine, ['spec/some/fileSpec.js', '--no-color']);
            GLib.idle_add(GLib.PRIORITY_DEFAULT, function () {
                expect(fakeJasmine.execute).toHaveBeenCalledWith(['spec/some/fileSpec.js']);
                done();
            });
        });
    });
});
