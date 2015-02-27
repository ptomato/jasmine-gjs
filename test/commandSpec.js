/* global jasmineImporter */

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;

const Command = jasmineImporter.command;
const JUnitReporter = jasmineImporter.junitReporter;
const TapReporter = jasmineImporter.tapReporter;
const VerboseReporter = jasmineImporter.verboseReporter;

// This is in case we are running the tests from a build tree that is different
// from the source tree, for example during 'make distcheck'.
let envSrcdir = GLib.getenv('SRCDIR');
const SRCDIR = envSrcdir? envSrcdir + '/' : '';

describe('Jasmine command', function () {
    let fakeJasmine;

    beforeEach(function () {
        fakeJasmine = jasmine.createSpyObj('jasmine', ['addReporter', 'configureDefaultReporter', 'execute']);
        spyOn(Mainloop, 'run');  // stub out system behaviour
    });

    describe('loading config', function () {
        beforeEach(function () {
            spyOn(window, 'print');  // suppress message
        });

        it('loads from a file', function () {
            let config = Command.loadConfig(SRCDIR + 'test/fixtures/jasmine.json');
            expect(config.a).toEqual('b');
            expect(config.c).toEqual('d');
        });

        it("errors out if the file doesn't exist", function () {
            expect(function () {
                Command.loadConfig('nonexist.json');
            }).toThrow();
        });

        it('errors out if the file is invalid', function () {
            expect(function () {
                Command.loadConfig(SRCDIR + 'test/fixtures/invalid.json');
            }).toThrow();
        });

        it("resolves paths relative to the config file's location", function () {
            let config = Command.loadConfig(SRCDIR + 'test/fixtures/path.json');
            let location = Gio.File.new_for_path(SRCDIR + 'test/fixtures');

            expect(config.include_paths).toContain(location.get_path());
            expect(config.spec_files).toContain(location.get_child('someSpec.js').get_path());
        });
    });

    describe('parsing config', function () {
        it('loads config from a file', function () {
            spyOn(Command, 'loadConfig').and.returnValue({});
            Command.run(fakeJasmine, ['--config', SRCDIR + 'test/fixtures/jasmine.json']);
            expect(Command.loadConfig).toHaveBeenCalled();
        });

        it('lets command line arguments override config options', function () {
            Command.run(fakeJasmine, ['--no-color'], { options: '--color' });
            expect(fakeJasmine.configureDefaultReporter)
                .toHaveBeenCalledWith(jasmine.objectContaining({ show_colors: false }));
        });

        it('parses an array of options as well as a single string', function () {
            Command.run(fakeJasmine, [], { options: ['--color', '--verbose'] });
            expect(fakeJasmine.addReporter).toHaveBeenCalled();
            expect(fakeJasmine.addReporter.calls.argsFor(0)[0].show_colors).toBeTruthy();
        });

        it('adds specs from the config file', function (done) {
            Command.run(fakeJasmine, [], { spec_files: 'myspecdir' });
            Mainloop.idle_add(function () {
                expect(fakeJasmine.execute).toHaveBeenCalledWith(['myspecdir']);
                done();
            });
        });

        it('parses an array of spec files as well as a single string', function (done) {
            Command.run(fakeJasmine, [], { spec_files: ['a.js', 'b.js'] });
            Mainloop.idle_add(function () {
                expect(fakeJasmine.execute).toHaveBeenCalledWith(['a.js', 'b.js']);
                done();
            });
        });

        it('overrides spec files from config if any are given on the command line', function (done) {
            Command.run(fakeJasmine, ['spec1.js'], { spec_files: 'spec2.js' });
            Mainloop.idle_add(function () {
                expect(fakeJasmine.execute).toHaveBeenCalledWith(['spec1.js']);
                done();
            });
        });

        it('adds exclusions from the config file', function () {
            Command.run(fakeJasmine, [], { exclude: ['a.js', 'b.js'] });
            expect(fakeJasmine.exclusions).toEqual(['a.js', 'b.js']);
        });

        it('parses a single string as well as an array of exclusions', function () {
            Command.run(fakeJasmine, [], { exclude: 'file.js' });
            expect(fakeJasmine.exclusions).toEqual(['file.js']);
        });

        it('ignores the default config if requested', function () {
            Command.run(fakeJasmine, ['--no-config'], { options: '--no-color' });
            expect(fakeJasmine.configureDefaultReporter)
                .toHaveBeenCalledWith(jasmine.objectContaining({ show_colors: true }));
        });
    });

    describe('adding GJS search paths', function () {
        let oldSearchPath;

        beforeEach(function () {
            oldSearchPath = imports.searchPath.slice();  // copy
        });

        afterEach(function () {
            imports.searchPath = oldSearchPath;
        });

        it('works from the config file', function () {
            Command.run(fakeJasmine, [], {
                include_paths: ['/fake/path', '/another/fake/path'],
            });
            expect(imports.searchPath).toContain('/fake/path');
            expect(imports.searchPath).toContain('/another/fake/path');
        });

        it('parses a single string as well as an array', function () {
            Command.run(fakeJasmine, [], { include_paths: '/fake/path' });
            expect(imports.searchPath).toContain('/fake/path');
        });
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
