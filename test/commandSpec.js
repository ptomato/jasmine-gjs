const Mainloop = imports.mainloop;

const Command = imports.command;
const TapReporter = imports.tapReporter;
const VerboseReporter = imports.verboseReporter;

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
