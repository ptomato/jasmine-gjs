/* global jasmineImporter */

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

let JasmineBoot = jasmineImporter.jasmineBoot;

// This is in case we are running the tests from a build tree that is different
// from the source tree, for example during 'make distcheck'.
let envSrcdir = GLib.getenv('SRCDIR');
const SRCDIR = envSrcdir? envSrcdir + '/' : '';

let customMatchers = {
    toMatchAllFiles: function () {
        return {
            compare: function (actual, expected) {
                let result = {
                    message: 'Expected ' + JSON.stringify(actual) + ' ',
                };
                if (actual.length !== expected.length) {
                    result.pass = false;
                    result.message += 'to match ' + expected.length + ' ' +
                        (expected.length === 1 ? 'file' : 'files') +
                        ', but it contained ' + actual.length;
                    return result;
                }

                let unexpectedFile;
                result.pass = actual.every((path) => {
                    let actualFile = Gio.File.new_for_path(path);
                    let retval = expected.some((expectedPath) => {
                        let expectedFile = Gio.File.new_for_path(expectedPath);
                        return actualFile.equal(expectedFile);
                    });
                    if (!retval)
                        unexpectedFile = path;
                    return retval;
                });
                if (result.pass) {
                    result.message += 'not to match a list of files ' +
                        expected + ', but it did.';
                } else if (unexpectedFile) {
                    result.message += 'to match a list of files ' + expected +
                        ', but it contained ' + unexpectedFile;
                } else {
                    result.message += 'to match the list of files ' + expected +
                        ', but it did not: ' + actual;
                }
                return result;
            },
        };
    },
};

describe('Jasmine boot', function () {
    let testJasmine;

    beforeEach(function () {
        let bootedJasmine = {
            getEnv: jasmine.createSpy('getEnv').and.returnValue({
                addReporter: jasmine.createSpy('addReporter'),
                execute: jasmine.createSpy('execute'),
            }),
            Timer: jasmine.createSpy('Timer'),
            Expectation: {
                addMatchers: jasmine.createSpy('addMatchers'),
            },
        };

        let fakeJasmineRequireObj = {
            core: jasmine.createSpy('core').and.returnValue(bootedJasmine),
            interface: jasmine.createSpy('interface'),
        };

        let fakeJasmineCore = {
            getJasmineRequireObj: function () { return fakeJasmineRequireObj; },
            __file__: 'fake/jasmine/path/jasmine.js',
        };

        testJasmine = new JasmineBoot.Jasmine({ jasmineCore: fakeJasmineCore });

        jasmine.addMatchers(customMatchers);
    });

    it('ignores a nonexistent spec file', function () {
        expect(testJasmine.specFiles).toEqual([]);
        testJasmine.addSpecFiles(['non/existent/file.js']);
        expect(testJasmine.specFiles).toEqual([]);
    });

    it('adds a real spec file', function () {
        expect(testJasmine.specFiles).toEqual([]);
        testJasmine.addSpecFiles([SRCDIR + 'test/fixtures/someSpec.js']);
        expect(testJasmine.specFiles).toMatchAllFiles([
            SRCDIR + 'test/fixtures/someSpec.js',
        ]);
    });

    it('adds more than one spec file', function () {
        expect(testJasmine.specFiles).toEqual([]);
        testJasmine.addSpecFiles([
            SRCDIR + 'test/fixtures/someSpec.js',
            SRCDIR + 'test/fixtures/otherSpec.js',
        ]);
        expect(testJasmine.specFiles).toMatchAllFiles([
            SRCDIR + 'test/fixtures/someSpec.js',
            SRCDIR + 'test/fixtures/otherSpec.js',
        ]);
    });

    it('adds a whole directory of spec files', function () {
        expect(testJasmine.specFiles).toEqual([]);
        testJasmine.addSpecFiles([SRCDIR + 'test/fixtures']);
        expect(testJasmine.specFiles).toMatchAllFiles([
            SRCDIR + 'test/fixtures/someSpec.js',
            SRCDIR + 'test/fixtures/otherSpec.js',
        ]);
        expect(testJasmine.specFiles.every((path) => path.indexOf('notASpec.txt') === -1)).toBe(true);
    });

    it('respects excluded files', function () {
        testJasmine.exclusions = ['otherSpec.js'];
        testJasmine.addSpecFiles([SRCDIR + 'test/fixtures']);
        expect(testJasmine.specFiles).toMatchAllFiles([
            SRCDIR + 'test/fixtures/someSpec.js'
        ]);
    });

    it('matches when the paths match', function () {
        testJasmine.exclusions = ['test/fixtures'];
        testJasmine.addSpecFiles([SRCDIR + 'test/fixtures']);
        expect(testJasmine.specFiles).toMatchAllFiles([]);
    });

    it('can handle globs in excluded files', function () {
        testJasmine.exclusions = ['*.js'];
        testJasmine.addSpecFiles([SRCDIR + 'test/fixtures']);
        expect(testJasmine.specFiles).toMatchAllFiles([]);
    });

    it('adds the Jasmine path when adding a reporter', function () {
        let fakeReporter = {};
        testJasmine.addReporter(fakeReporter);
        expect(fakeReporter.jasmine_core_path).toMatch('fake/jasmine/path');
    });
});
