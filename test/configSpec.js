/* global jasmineImporter */

const {Gio, GLib} = imports.gi;

const Config = jasmineImporter.config;
const Options = jasmineImporter.options;

// This is in case we are running the tests from a build tree that is different
// from the source tree, for example during 'meson test'.
const envSrcdir = GLib.getenv('SRCDIR');
const SRCDIR = envSrcdir ? `${envSrcdir}/` : '';

describe('Ensure array', function () {
    it('does not change an array', function () {
        expect(Config.ensureArray(['a', 'b'])).toEqual(['a', 'b']);
    });

    it('puts a single value into an array', function () {
        expect(Config.ensureArray('a')).toEqual(['a']);
    });
});

describe('Loading configuration', function () {
    beforeEach(function () {
        // suppress messages
        spyOn(globalThis, 'print');
        spyOn(globalThis, 'printerr');
    });

    it('loads from a file', function () {
        const config = Config.loadConfig({config: `${SRCDIR}test/fixtures/jasmine.json`});
        expect(config.a).toEqual('b');
        expect(config.c).toEqual('d');
    });

    it("doesn't load the file if no-config specified", function () {
        const config = Config.loadConfig({
            'no-config': true,
            config: `${SRCDIR}test/fixtures/jasmine.json`,
        });
        const keys = Object.keys(config);
        expect(keys).not.toContain('a');
        expect(keys).not.toContain('c');
    });

    it('loads the default file if none given', function () {
        const config = Config.loadConfig({}, `${SRCDIR}test/fixtures/jasmine.json`);
        expect(config.a).toEqual('b');
        expect(config.c).toEqual('d');
    });

    it("errors out if the file doesn't exist", function () {
        expect(() => Config.loadConfig({config: 'nonexist.json'})).toThrow();
    });

    it("doesn't error out if the default file doesn't exist", function () {
        expect(() => Config.loadConfig({}, 'nonexist.json')).not.toThrow();
    });

    it('errors out if the file is invalid', function () {
        expect(() => Config.loadConfig({
            config: `${SRCDIR}test/fixtures/invalid.json`,
        })).toThrow();
    });

    it("resolves paths relative to the config file's location", function () {
        const config = Config.loadConfig({config: `${SRCDIR}test/fixtures/path.json`});
        const location = Gio.File.new_for_path(`${SRCDIR}test/fixtures`);

        expect(config.include_paths).toContain(location.get_path());
        expect(config.spec_files).toContain(location.get_child('someSpec.js').get_path());
    });

    it('warns about unrecognized config options', function () {
        Config.loadConfig({config: `${SRCDIR}test/fixtures/jasmine.json`});
        expect(globalThis.printerr).toHaveBeenCalledWith(jasmine.stringMatching(/^warning: /));
    });
});

describe('Configuration options to arguments', function () {
    it('lets command line arguments override config options', function () {
        const args = Config.configToArgs({options: '--color'},
            ...Options.parseOptions(['--no-color']));
        expect(args.indexOf('--no-color')).toBeGreaterThan(args.indexOf('--color'));
    });

    it('adds one search path', function () {
        const args = Config.configToArgs({include_paths: '/a'});
        expect(args.join(' ')).toMatch('-I /a');
    });

    it('adds multiple search paths', function () {
        const args = Config.configToArgs({include_paths: ['/a', '/b']});
        expect(args.join(' ')).toMatch('-I /a');
        expect(args.join(' ')).toMatch('-I /b');
    });

    it('adds search paths in the right order', function () {
        const args = Config.configToArgs({include_paths: ['/a', '/b']});
        const argstring = args.join(' ');
        expect(argstring.indexOf('-I /a')).toBeLessThan(argstring.indexOf('-I /b'));
    });

    it('adds one exclusion path', function () {
        const args = Config.configToArgs({exclude: 'a'});
        expect(args.join(' ')).toMatch('--exclude a');
    });

    it('adds more than one exclusion path', function () {
        const args = Config.configToArgs({exclude: ['a', 'b']});
        expect(args.join(' ')).toMatch('--exclude a');
        expect(args.join(' ')).toMatch('--exclude b');
    });

    it('adds exclusions from the command line', function () {
        const args = Config.configToArgs({}, ...Options.parseOptions(['--exclude', 'a.js']));
        expect(args.join(' ')).toMatch('--exclude a.js');
    });

    it('combines exclusions from the command line and the config file', function () {
        const args = Config.configToArgs({exclude: 'b.js'},
            ...Options.parseOptions(['--exclude', 'a.js']));
        expect(args.join(' ')).toMatch('--exclude a.js');
        expect(args.join(' ')).toMatch('--exclude b.js');
    });

    it('adds one extra option', function () {
        const args = Config.configToArgs({options: '--foo'});
        expect(args).toContain('--foo');
    });

    it('adds more than one extra option', function () {
        const args = Config.configToArgs({options: ['--foo', '--bar']});
        expect(args.join(' ')).toMatch('--foo --bar');
        // order should be preserved here
    });

    it('adds one spec file', function () {
        const args = Config.configToArgs({spec_files: 'a'});
        expect(args).toContain('a');
    });

    it('adds more than one spec file', function () {
        const args = Config.configToArgs({spec_files: ['a', 'b']});
        expect(args).toContain('a');
        expect(args).toContain('b');
    });

    it('does not add spec files from config if there were some on the command line', function () {
        const args = Config.configToArgs({spec_files: ['a', 'b']}, ['c']);
        expect(args).not.toContain('a');
        expect(args).not.toContain('b');
    });

    it('passes the arguments on to the subprocess', function () {
        const args = Config.configToArgs({}, ...Options.parseOptions(['--color', 'spec.js']));
        expect(args).toContain('--color', 'spec.js');
    });

    it('passes the config file on to the subprocess as arguments', function () {
        const args = Config.configToArgs({
            environment: {},
            include_paths: ['/path1', '/path2'],
            options: ['--color'],
            exclude: ['nonspec*.js'],
            spec_files: ['a.js', 'b.js'],
        }, [], {});
        expect(args.join(' ')).toMatch('-I /path1');
        expect(args.join(' ')).toMatch('-I /path2');
        expect(args.join(' ')).toMatch(/--exclude nonspec\*\.js/);
        expect(args).toContain('--color', 'a.js', 'b.js');
    });

    it('does not pass the config file specs if specs were on the command line', function () {
        const args = Config.configToArgs({
            environment: {},
            spec_files: ['spec2.js'],
        }, ['spec1.js']);
        expect(args).toContain('spec1.js');
        expect(args).not.toContain('spec2.js');
    });
});

describe('Manipulating the environment', function () {
    let launcher;

    beforeEach(function () {
        launcher = jasmine.createSpyObj('launcher', ['setenv', 'unsetenv']);
    });

    it('sets environment variables in the launcher', function () {
        Config.prepareLauncher(launcher, {
            environment: {
                'MY_VARIABLE': 'my_value',
            },
        });
        expect(launcher.setenv).toHaveBeenCalledWith('MY_VARIABLE', 'my_value', true);
    });

    it('unsets environment variables with null values', function () {
        Config.prepareLauncher(launcher, {
            environment: {
                'MY_VARIABLE': null,
            },
        });
        expect(launcher.unsetenv).toHaveBeenCalledWith('MY_VARIABLE');
    });
});

describe('Manipulating the launcher command line', function () {
    let args;

    beforeEach(function () {
        args = ['jasmine-runner', '--verbose', 'foo.js'];
    });

    it('executes jasmine-runner with a different interpreter binary', function () {
        args = Config.wrapArgs(args, {
            interpreter: '/path/to/custom/gjs',
        });
        expect(args).toEqual(['/path/to/custom/gjs', 'jasmine-runner', '--verbose', 'foo.js']);
    });

    it('allows adding arguments to the interpreter', function () {
        args = Config.wrapArgs(args, {
            interpreter: 'gjs -d',
        });
        expect(args).toEqual(['gjs', '-d', 'jasmine-runner', '--verbose', 'foo.js']);
    });

    it('executes jasmine-runner with a different interpreter binary from the command line', function () {
        args = Config.wrapArgs(args, {}, {
            interpreter: '/path/to/custom/gjs',
        });
        expect(args).toEqual(['/path/to/custom/gjs', 'jasmine-runner', '--verbose', 'foo.js']);
    });

    it('gives the interpreter specified on the command line priority', function () {
        args = Config.wrapArgs(args, {
            interpreter: '/path/to/other/gjs',
        }, {
            interpreter: '/path/to/custom/gjs',
        });
        expect(args).toEqual(['/path/to/custom/gjs', 'jasmine-runner', '--verbose', 'foo.js']);
    });
});
