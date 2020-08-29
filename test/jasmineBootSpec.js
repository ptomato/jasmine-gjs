/* global jasmineImporter */

const {Gio, GLib} = imports.gi;

const JasmineBoot = jasmineImporter.jasmineBoot;

// This is in case we are running the tests from a build tree that is different
// from the source tree, for example during 'make distcheck'.
const envSrcdir = GLib.getenv('SRCDIR');
const SRCDIR = envSrcdir ? `${envSrcdir}/` : '';

const customMatchers = {
    toMatchAllFiles() {
        return {
            compare(actual, expected) {
                const result = {
                    message: `Expected ${JSON.stringify(actual)} `,
                };
                if (actual.length !== expected.length) {
                    result.pass = false;
                    result.message += `to match ${expected.length} ${
                        expected.length === 1 ? 'file' : 'files'
                    }, but it contained ${actual.length}`;
                    return result;
                }

                let unexpectedFile;
                result.pass = actual.every(path => {
                    const actualFile = Gio.File.new_for_path(path);
                    const retval = expected.some(expectedPath => {
                        const expectedFile = Gio.File.new_for_path(expectedPath);
                        return actualFile.equal(expectedFile);
                    });
                    if (!retval)
                        unexpectedFile = path;
                    return retval;
                });
                if (result.pass) {
                    result.message += `not to match a list of files ${
                        expected}, but it did.`;
                } else if (unexpectedFile) {
                    result.message += `to match a list of files ${expected
                    }, but it contained ${unexpectedFile}`;
                } else {
                    result.message += `to match the list of files ${expected
                    }, but it did not: ${actual}`;
                }
                return result;
            },
        };
    },
};

describe('Jasmine boot', function () {
    let testJasmine;

    beforeEach(function () {
        const bootedJasmine = {
            getEnv: jasmine.createSpy('getEnv').and.returnValue({
                addReporter: jasmine.createSpy('addReporter'),
                execute: jasmine.createSpy('execute'),
            }),
            Timer: jasmine.createSpy('Timer'),
            Expectation: {
                addMatchers: jasmine.createSpy('addMatchers'),
            },
        };

        const fakeJasmineRequireObj = {
            core: jasmine.createSpy('core').and.returnValue(bootedJasmine),
            interface: jasmine.createSpy('interface'),
        };

        const fakeJasmineCore = {
            getJasmineRequireObj() {
                return fakeJasmineRequireObj;
            },
            __file__: 'fake/jasmine/path/jasmine.js',
        };

        testJasmine = new JasmineBoot.Jasmine({jasmineCore: fakeJasmineCore});

        jasmine.addMatchers(customMatchers);
    });

    it('adds a nonexistent spec file', function () {
        expect(testJasmine.specFiles).toEqual([]);
        testJasmine.addSpecFiles([`${SRCDIR}non/existent/file.js`]);
        expect(testJasmine.specFiles).toMatchAllFiles([
            `${SRCDIR}non/existent/file.js`,
        ]);
    });

    it('adds a real spec file', function () {
        expect(testJasmine.specFiles).toEqual([]);
        testJasmine.addSpecFiles([`${SRCDIR}test/fixtures/someSpec.js`]);
        expect(testJasmine.specFiles).toMatchAllFiles([
            `${SRCDIR}test/fixtures/someSpec.js`,
        ]);
    });

    it('adds more than one spec file', function () {
        expect(testJasmine.specFiles).toEqual([]);
        testJasmine.addSpecFiles([
            `${SRCDIR}test/fixtures/someSpec.js`,
            `${SRCDIR}test/fixtures/otherSpec.js`,
        ]);
        expect(testJasmine.specFiles).toMatchAllFiles([
            `${SRCDIR}test/fixtures/someSpec.js`,
            `${SRCDIR}test/fixtures/otherSpec.js`,
        ]);
    });

    it('adds a whole directory of spec files', function () {
        expect(testJasmine.specFiles).toEqual([]);
        testJasmine.addSpecFiles([`${SRCDIR}test/fixtures`]);
        expect(testJasmine.specFiles).toMatchAllFiles([
            `${SRCDIR}test/fixtures/include/module.js`,
            `${SRCDIR}test/fixtures/include/spec.js`,
            `${SRCDIR}test/fixtures/otherSpec.js`,
            `${SRCDIR}test/fixtures/path1/test.js`,
            `${SRCDIR}test/fixtures/path2/test.js`,
            `${SRCDIR}test/fixtures/someSpec.js`,
            `${SRCDIR}test/fixtures/syntaxErrorSpec.js`,
        ]);
        expect(testJasmine.specFiles.every(path => path.indexOf('notASpec.txt') === -1)).toBe(true);
    });

    it('adds spec files in different directories with the same name', function () {
        testJasmine.addSpecFiles([
            `${SRCDIR}test/fixtures/path1`,
            `${SRCDIR}test/fixtures/path2`,
        ]);
        expect(testJasmine.specFiles).toMatchAllFiles([
            `${SRCDIR}test/fixtures/path1/test.js`,
            `${SRCDIR}test/fixtures/path2/test.js`,
        ]);
    });

    it('respects excluded files', function () {
        testJasmine.exclusions = ['otherSpec.js', 'syntaxErrorSpec.js'];
        testJasmine.addSpecFiles([`${SRCDIR}test/fixtures`]);
        expect(testJasmine.specFiles).toMatchAllFiles([
            `${SRCDIR}test/fixtures/include/module.js`,
            `${SRCDIR}test/fixtures/include/spec.js`,
            `${SRCDIR}test/fixtures/someSpec.js`,
            `${SRCDIR}test/fixtures/path1/test.js`,
            `${SRCDIR}test/fixtures/path2/test.js`,
        ]);
    });

    it('matches at the end of the containing path', function () {
        testJasmine.exclusions = ['test/fixtures'];
        testJasmine.addSpecFiles([`${SRCDIR}test/fixtures`]);
        expect(testJasmine.specFiles).toMatchAllFiles([
            `${SRCDIR}test/fixtures/include/module.js`,
            `${SRCDIR}test/fixtures/include/spec.js`,
            `${SRCDIR}test/fixtures/path1/test.js`,
            `${SRCDIR}test/fixtures/path2/test.js`,
        ]);
    });

    it('can handle globs in excluded files', function () {
        testJasmine.exclusions = ['*.js'];
        testJasmine.addSpecFiles([`${SRCDIR}test/fixtures`]);
        expect(testJasmine.specFiles).toMatchAllFiles([]);
    });

    it('adds the Jasmine path when adding a reporter', function () {
        const fakeReporter = {};
        testJasmine.addReporter(fakeReporter);
        expect(fakeReporter.jasmine_core_path).toMatch('fake/jasmine/path');
    });

    it('imports spec files in different directories with the same name', function () {
        testJasmine.addSpecFiles([
            `${SRCDIR}test/fixtures/path1`,
            `${SRCDIR}test/fixtures/path2`,
        ]);
        expect(() => testJasmine.loadSpecs()).toThrowError(Error,
            'Catch this error to ensure this file is loaded');
    });

    it('does not bail out altogether if one of the specs has a syntax error', function () {
        testJasmine.addSpecFiles([`${SRCDIR}test/fixtures/syntaxErrorSpec.js`]);
        expect(() => testJasmine.loadSpecs()).not.toThrow();
    });

    it('does not bail out altogether if one of the specs does not exist', function () {
        testJasmine.addSpecFiles(['non/existent/file.js']);
        expect(() => testJasmine.loadSpecs()).not.toThrow();
    });
});
