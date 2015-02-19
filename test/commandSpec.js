/* global jasmineImporter */

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;

const Command = jasmineImporter.command;
const JUnitReporter = jasmineImporter.junitReporter;
const TapReporter = jasmineImporter.tapReporter;
const VerboseReporter = jasmineImporter.verboseReporter;

describe('Jasmine command', function () {
    let fakeJasmine;

    beforeEach(function () {
        fakeJasmine = jasmine.createSpyObj('jasmine', ['addReporter', 'configureDefaultReporter', 'execute']);
        spyOn(Mainloop, 'run');  // stub out system behaviour
    });

    describe('running specs', function () {
        it('shows colors by default', function () {
            Command.run(fakeJasmine, []);
            expect(fakeJasmine.configureDefaultReporter)
                .toHaveBeenCalledWith(jasmine.objectContaining({ show_colors: true }));
        });

        it('allows colors to be turned off', function () {
            Command.run(fakeJasmine, ['--no-color']);
            expect(fakeJasmine.configureDefaultReporter)
                .toHaveBeenCalledWith(jasmine.objectContaining({ show_colors: false }));
        });

        it('loads the verbose reporter', function () {
            Command.run(fakeJasmine, ['--verbose']);
            expect(fakeJasmine.configureDefaultReporter).not.toHaveBeenCalled();
            expect(fakeJasmine.addReporter).toHaveBeenCalled();
            let reporter = fakeJasmine.addReporter.calls.argsFor(0)[0];
            expect(reporter.constructor).toBe(VerboseReporter.VerboseReporter);
        });

        it('loads the TAP reporter', function () {
            Command.run(fakeJasmine, ['--tap']);
            expect(fakeJasmine.configureDefaultReporter).not.toHaveBeenCalled();
            expect(fakeJasmine.addReporter).toHaveBeenCalled();
            let reporter = fakeJasmine.addReporter.calls.argsFor(0)[0];
            expect(reporter.constructor).toBe(TapReporter.TapReporter);
        });

        it('loads the JUnit reporter alongside the usual reporter', function () {
            // Unfortunately /dev/null can't be opened as a GFile, so we need to
            // write to a temporary file.
            let [tmpFile, stream] = Gio.File.new_tmp('junitreportXXXXXX');
            let tmpPath = tmpFile.get_path();
            stream.close(null);

            Command.run(fakeJasmine, ['--junit', tmpPath]);
            expect(fakeJasmine.configureDefaultReporter).toHaveBeenCalled();
            expect(fakeJasmine.addReporter).toHaveBeenCalled();
            let reporter = fakeJasmine.addReporter.calls.argsFor(0)[0];
            expect(reporter.constructor).toBe(JUnitReporter.JUnitReporter);

            tmpFile.delete(null);
            // COMPAT in GLib >= 2.34:
            // tmpFile.delete_async(GLib.PRIORITY_DEFAULT, null, function () {});
        });

        it('executes the Jasmine suite', function (done) {
            Command.run(fakeJasmine, []);
            // fakeJasmine.execute() is started in idle
            Mainloop.idle_add(function () {
                expect(fakeJasmine.execute).toHaveBeenCalled();
                done();
            });
        });

        it('runs the specified specs', function (done) {
            Command.run(fakeJasmine, ['spec/some/fileSpec.js', '--no-color']);
            Mainloop.idle_add(function () {
                expect(fakeJasmine.execute).toHaveBeenCalledWith(['spec/some/fileSpec.js']);
                done();
            });
        });
    });
});
