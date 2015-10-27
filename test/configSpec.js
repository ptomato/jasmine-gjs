/* global jasmineImporter */

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const Config = jasmineImporter.config;

// This is in case we are running the tests from a build tree that is different
// from the source tree, for example during 'make distcheck'.
let envSrcdir = GLib.getenv('SRCDIR');
const SRCDIR = envSrcdir? envSrcdir + '/' : '';

describe('Loading configuration', function () {
    beforeEach(function () {
        // suppress messages
        spyOn(window, 'print');
        spyOn(window, 'printerr');
    });

    it('loads from a file', function () {
        let config = Config.loadConfig({ config: SRCDIR + 'test/fixtures/jasmine.json' });
        expect(config.a).toEqual('b');
        expect(config.c).toEqual('d');
    });

    it("doesn't load the file if no-config specified", function () {
        let config = Config.loadConfig({
            'no-config': true,
            config: SRCDIR + 'test/fixtures/jasmine.json',
        });
        expect(config.a).not.toEqual('b');
        expect(config.c).not.toEqual('d');
    });

    it('loads the default file if none given', function () {
        let config = Config.loadConfig({}, SRCDIR + 'test/fixtures/jasmine.json');
        expect(config.a).toEqual('b');
        expect(config.c).toEqual('d');
    });

    it("errors out if the file doesn't exist", function () {
        expect(() => Config.loadConfig({ config: 'nonexist.json' })).toThrow();
    });

    it("doesn't error out if the default file doesn't exist", function () {
        expect(() => Config.loadConfig({}, 'nonexist.json')).not.toThrow();
    });

    it('errors out if the file is invalid', function () {
        expect(() => Config.loadConfig({
            config: SRCDIR + 'test/fixtures/invalid.json',
        })).toThrow();
    });

    it("resolves paths relative to the config file's location", function () {
        let config = Config.loadConfig({ config: SRCDIR + 'test/fixtures/path.json' });
        let location = Gio.File.new_for_path(SRCDIR + 'test/fixtures');

        expect(config.include_paths).toContain(location.get_path());
        expect(config.spec_files).toContain(location.get_child('someSpec.js').get_path());
    });

    it('warns about unrecognized config options', function () {
        Config.loadConfig({ config: SRCDIR + 'test/fixtures/jasmine.json' });
        expect(window.printerr).toHaveBeenCalledWith(jasmine.stringMatching(/^warning: /));
    });
});

describe('Configuration options to arguments', function () {
    it('adds one search path', function () {
        let args = Config.configToArgs({ include_paths: '/a' });
        expect(args.join(' ')).toMatch('-I /a');
    });

    it('adds multiple search paths', function () {
        let args = Config.configToArgs({ include_paths: ['/a', '/b'] });
        expect(args.join(' ')).toMatch('-I /a');
        expect(args.join(' ')).toMatch('-I /b');
    });

    it('adds one exclusion path', function () {
        let args = Config.configToArgs({ exclude: 'a' });
        expect(args.join(' ')).toMatch('--exclude a');
    });

    it('adds more than one exclusion path', function () {
        let args = Config.configToArgs({ exclude: ['a', 'b'] });
        expect(args.join(' ')).toMatch('--exclude a');
        expect(args.join(' ')).toMatch('--exclude b');
    });

    it('adds one extra option', function () {
        let args = Config.configToArgs({ options: '--foo' });
        expect(args).toContain('--foo');
    });

    it('adds more than one extra option', function () {
        let args = Config.configToArgs({ options: ['--foo', '--bar'] });
        expect(args.join(' ')).toMatch('--foo --bar');
        // order should be preserved here
    });

    it('adds one spec file', function () {
        let args = Config.configToArgs({ spec_files: 'a' }, true);
        expect(args).toContain('a');
    });

    it('adds more than one spec file', function () {
        let args = Config.configToArgs({ spec_files: ['a', 'b'] }, true);
        expect(args).toContain('a');
        expect(args).toContain('b');
    });

    it('does not add spec files unless requested', function () {
        let args = Config.configToArgs({ spec_files: ['a', 'b'] });
        expect(args).not.toContain('a');
        expect(args).not.toContain('b');
    });
});
