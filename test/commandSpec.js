/* global jasmineImporter */

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;

const Config = jasmineImporter.config;
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

    describe('parsing config', function () {
        it('loads config from a file', function () {
            spyOn(Config, 'loadConfig').and.returnValue({});
            Command.run(fakeJasmine, ['--config', SRCDIR + 'test/fixtures/jasmine.json']);
            expect(Config.loadConfig).toHaveBeenCalled();
        });

        it('lets command line arguments override config options', function () {
            Command.run(fakeJasmine, ['--no-color'], { options: '--color' });
            expect(fakeJasmine.addReporter)
                .toHaveBeenCalledWith(jasmine.objectContaining({ show_colors: false }));
        });

        it('parses an array of options as well as a single string', function () {
            Command.run(fakeJasmine, [], { options: ['--color', '--verbose'] });
            expect(fakeJasmine.addReporter).toHaveBeenCalled();
            let reporter = fakeJasmine.addReporter.calls.argsFor(0)[0];
            expect(reporter.show_colors).toBeTruthy();
            expect(reporter.constructor).toBe(VerboseReporter.VerboseReporter);
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

        it('adds exclusions from the command line', function () {
            Command.run(fakeJasmine, ['--exclude', 'a.js'], {});
            expect(fakeJasmine.exclusions).toEqual(['a.js']);
        });

        it('adds exclusions from the config file', function () {
            Command.run(fakeJasmine, [], { exclude: ['a.js', 'b.js'] });
            expect(fakeJasmine.exclusions).toEqual(['a.js', 'b.js']);
        });

        it('parses a single string as well as an array of exclusions', function () {
            Command.run(fakeJasmine, [], { exclude: 'file.js' });
            expect(fakeJasmine.exclusions).toEqual(['file.js']);
        });

        it('combines exclusions from the command line and the config file', function () {
            Command.run(fakeJasmine, ['--exclude', 'a.js'], { exclude: 'b.js' });
            expect(fakeJasmine.exclusions).toEqual(jasmine.arrayContaining(['a.js',
                'b.js']));
            expect(fakeJasmine.exclusions.length).toBe(2);
        });

        it('ignores the default config if requested', function () {
            Command.run(fakeJasmine, ['--no-config'], { options: '--no-color' });
            expect(fakeJasmine.addReporter)
                .toHaveBeenCalledWith(jasmine.objectContaining({ show_colors: true }));
        });
    });

    describe('manipulating the environment', function () {
        let launcher, realLauncher;

        beforeAll(function () {
            realLauncher = Gio.SubprocessLauncher;
            // Mock out system behaviour
            Gio.SubprocessLauncher = function () {
                let process = jasmine.createSpyObj('Subprocess', [
                    'wait',
                    'get_if_exited',
                    'get_exit_status',
                ]);
                process.get_if_exited.and.returnValue(true);
                process.get_exit_status.and.returnValue(0);
                this.setenv = jasmine.createSpy('setenv');
                this.unsetenv = jasmine.createSpy('unsetenv');
                this.spawnv = jasmine.createSpy('spawnv').and.returnValue(process);
                launcher = this;
            };
        });

        afterAll(function () {
            Gio.SubprocessLauncher = realLauncher;
        });

        it('launches a subprocess when changing the environment', function () {
            expect(Command.run(fakeJasmine, [], {
                environment: {
                    'MY_VARIABLE': 'my_value',
                },
            })).toEqual(0);
            expect(launcher.setenv).toHaveBeenCalledWith('MY_VARIABLE', 'my_value', true);
            expect(launcher.spawnv).toHaveBeenCalled();
        });

        it('unsets environment variables with null values', function () {
            Command.run(fakeJasmine, [], {
                environment: {
                    'MY_VARIABLE': null,
                },
            });
            expect(launcher.unsetenv).toHaveBeenCalledWith('MY_VARIABLE');
            expect(launcher.setenv).not.toHaveBeenCalled();
        });

        it('passes the arguments on to the subprocess', function () {
            Command.run(fakeJasmine, ['--color', 'spec.js'], { environment: {} });
            expect(launcher.spawnv).toHaveBeenCalledWith(jasmine.arrayContaining(['--color',
                'spec.js']));
        });

        it('tells the subprocess to ignore the config file', function () {
            Command.run(fakeJasmine, [], { environment: {} });
            expect(launcher.spawnv).toHaveBeenCalledWith(jasmine.arrayContaining(['--no-config']));
        });

        it('passes the config file on to the subprocess as arguments', function () {
            Command.run(fakeJasmine, [], {
                environment: {},
                include_paths: ['/path1', '/path2'],
                options: ['--color'],
                exclude: ['nonspec*.js'],
                spec_files: ['a.js', 'b.js'],
            });
            let subprocessArgs = launcher.spawnv.calls.mostRecent().args[0];
            function subsequence(array, subseq) {
                for (let ix = 0; ix < array.length - subseq.length + 1; ix++) {
                    let subseqToTest = array.slice(ix, ix + subseq.length);
                    if (subseqToTest.every((el, ix) => (el === subseq[ix])))
                        return true;
                }
                return false;
            }
            expect(subsequence(subprocessArgs, ['-I', '/path1'])).toBeTruthy();
            expect(subsequence(subprocessArgs, ['-I', '/path2'])).toBeTruthy();
            expect(subsequence(subprocessArgs, ['--exclude', 'nonspec*.js'])).toBeTruthy();
            expect(launcher.spawnv).toHaveBeenCalledWith(jasmine.arrayContaining(['--color',
                'a.js', 'b.js']));
        });

        it('does not pass the config file specs if specs were on the command line', function () {
            Command.run(fakeJasmine, ['spec1.js'], {
                environment: {},
                spec_files: ['spec2.js'],
            });
            expect(launcher.spawnv).toHaveBeenCalledWith(jasmine.arrayContaining(['spec1.js']));
            expect(launcher.spawnv).not.toHaveBeenCalledWith(jasmine.arrayContaining(['spec2.js']));
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

        it('does so in the right order', function () {
            Command.run(fakeJasmine, [], {
                include_paths: ['/fake/path', '/another/fake/path'],
            });
            expect(imports.searchPath[0]).toBe('/fake/path');
            expect(imports.searchPath[1]).toBe('/another/fake/path');
        });

        it('parses a single string as well as an array', function () {
            Command.run(fakeJasmine, [], { include_paths: '/fake/path' });
            expect(imports.searchPath).toContain('/fake/path');
        });
    });

    describe('running specs', function () {
        it('shows colors by default', function () {
            Command.run(fakeJasmine, []);
            expect(fakeJasmine.addReporter)
                .toHaveBeenCalledWith(jasmine.objectContaining({ show_colors: true }));
        });

        it('allows colors to be turned off', function () {
            Command.run(fakeJasmine, ['--no-color']);
            expect(fakeJasmine.addReporter)
                .toHaveBeenCalledWith(jasmine.objectContaining({ show_colors: false }));
        });

        it('loads the verbose reporter', function () {
            Command.run(fakeJasmine, ['--verbose']);
            expect(fakeJasmine.addReporter).toHaveBeenCalled();
            let reporter = fakeJasmine.addReporter.calls.argsFor(0)[0];
            expect(reporter.constructor).toBe(VerboseReporter.VerboseReporter);
        });

        it('loads the TAP reporter', function () {
            Command.run(fakeJasmine, ['--tap']);
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
            expect(fakeJasmine.addReporter.calls.count()).toBe(2);
            let reporters = fakeJasmine.addReporter.calls.allArgs().map((args) => args[0].constructor);
            expect(reporters).toContain(JUnitReporter.JUnitReporter);

            tmpFile.delete(null);
            // COMPAT in GLib >= 2.34:
            // tmpFile.delete_async(GLib.PRIORITY_DEFAULT, null, function () {});
        });

        it('creates a directory for the report if necessary', function () {
            let tmpDir = GLib.dir_make_tmp('junitreportXXXXXX');
            let tmpFile =
                Gio.File.new_for_path(tmpDir).get_child('dir').get_child('report.xml');
            let tmpPath = tmpFile.get_path();

            Command.run(fakeJasmine, ['--junit', tmpPath]);
            expect(tmpFile.query_exists(null)).toBeTruthy();

            tmpFile.delete(null);
            tmpFile.get_parent().delete(null);
            tmpFile.get_parent().get_parent().delete(null);
            // COMPAT in GLib >= 2.34:
            // Use tmpFile.delete_async()
        });

        it('uses the value of JASMINE_JUNIT_REPORTS_DIR', function () {
            let oldPath = GLib.getenv('JASMINE_JUNIT_REPORTS_DIR');
            let tmpDir = GLib.dir_make_tmp('junitreportXXXXXX');
            GLib.setenv('JASMINE_JUNIT_REPORTS_DIR', tmpDir, true);

            Command.run(fakeJasmine, ['--junit', 'report.xml']);
            let reportFile =
                Gio.File.new_for_path(tmpDir).get_child('report.xml');
            expect(reportFile.query_exists(null)).toBeTruthy();

            reportFile.delete(null);
            reportFile.get_parent().delete(null);
            // COMPAT in GLib >= 2.34:
            // Use tmpFile.delete_async()

            if (oldPath !== null)
                GLib.setenv('JASMINE_JUNIT_REPORTS_DIR', oldPath, true);
            else
                GLib.unsetenv('JASMINE_JUNIT_REPORTS_DIR');
        });

        it('executes the Jasmine suite', function (done) {
            expect(Command.run(fakeJasmine, [])).toEqual(0);
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
