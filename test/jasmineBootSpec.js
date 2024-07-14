import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import * as JasmineBoot from '../src/jasmineBoot.js';

const [testFile] = GLib.filename_from_uri(import.meta.url);
const testDir = GLib.path_get_dirname(testFile);

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
                configure: jasmine.createSpy('configure'),
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
        testJasmine.addSpecFiles([`${testDir}/non/existent/file.js`]);
        expect(testJasmine.specFiles).toMatchAllFiles([
            `${testDir}/non/existent/file.js`,
        ]);
    });

    it('adds a real spec file', function () {
        expect(testJasmine.specFiles).toEqual([]);
        testJasmine.addSpecFiles([`${testDir}/fixtures/someSpec.js`]);
        expect(testJasmine.specFiles).toMatchAllFiles([
            `${testDir}/fixtures/someSpec.js`,
        ]);
    });

    it('adds more than one spec file', function () {
        expect(testJasmine.specFiles).toEqual([]);
        testJasmine.addSpecFiles([
            `${testDir}/fixtures/someSpec.js`,
            `${testDir}/fixtures/otherSpec.js`,
        ]);
        expect(testJasmine.specFiles).toMatchAllFiles([
            `${testDir}/fixtures/someSpec.js`,
            `${testDir}/fixtures/otherSpec.js`,
        ]);
    });

    it('adds a whole directory of spec files', function () {
        expect(testJasmine.specFiles).toEqual([]);
        testJasmine.addSpecFiles([`${testDir}/fixtures`]);
        expect(testJasmine.specFiles).toMatchAllFiles([
            `${testDir}/fixtures/include/module.js`,
            `${testDir}/fixtures/include/spec.js`,
            `${testDir}/fixtures/otherSpec.js`,
            `${testDir}/fixtures/path1/test.js`,
            `${testDir}/fixtures/path2/test.js`,
            `${testDir}/fixtures/someSpec.js`,
            `${testDir}/fixtures/syntaxErrorSpec.js`,
        ]);
        expect(testJasmine.specFiles.every(path => path.indexOf('notASpec.txt') === -1)).toBe(true);
    });

    it('adds spec files in different directories with the same name', function () {
        testJasmine.addSpecFiles([
            `${testDir}/fixtures/path1`,
            `${testDir}/fixtures/path2`,
        ]);
        expect(testJasmine.specFiles).toMatchAllFiles([
            `${testDir}/fixtures/path1/test.js`,
            `${testDir}/fixtures/path2/test.js`,
        ]);
    });

    it('respects excluded files', function () {
        testJasmine.exclusions = ['otherSpec.js', 'syntaxErrorSpec.js'];
        testJasmine.addSpecFiles([`${testDir}/fixtures`]);
        expect(testJasmine.specFiles).toMatchAllFiles([
            `${testDir}/fixtures/include/module.js`,
            `${testDir}/fixtures/include/spec.js`,
            `${testDir}/fixtures/someSpec.js`,
            `${testDir}/fixtures/path1/test.js`,
            `${testDir}/fixtures/path2/test.js`,
        ]);
    });

    it('matches at the end of the containing path', function () {
        testJasmine.exclusions = ['test/fixtures'];
        testJasmine.addSpecFiles([`${testDir}/fixtures`]);
        expect(testJasmine.specFiles).toMatchAllFiles([
            `${testDir}/fixtures/include/module.js`,
            `${testDir}/fixtures/include/spec.js`,
            `${testDir}/fixtures/path1/test.js`,
            `${testDir}/fixtures/path2/test.js`,
        ]);
    });

    it('can handle globs in excluded files', function () {
        testJasmine.exclusions = ['*.js'];
        testJasmine.addSpecFiles([`${testDir}/fixtures`]);
        expect(testJasmine.specFiles).toMatchAllFiles([]);
    });

    it('adds the Jasmine path when adding a reporter', function () {
        const fakeReporter = {};
        testJasmine.addReporter(fakeReporter);
        expect(fakeReporter.jasmine_core_path).toMatch('fake/jasmine/path');
    });

    it('imports spec files in different directories with the same name', function () {
        testJasmine.addSpecFiles([
            `${testDir}/fixtures/path1`,
            `${testDir}/fixtures/path2`,
        ]);
        expectAsync(testJasmine.loadSpecs()).toBeRejectedWithError(Error,
            'Catch this error to ensure this file is loaded');
    });

    it('does not bail out altogether if one of the specs has a syntax error', function () {
        testJasmine.addSpecFiles([`${testDir}/fixtures/syntaxErrorSpec.js`]);
        expectAsync(testJasmine.loadSpecs()).toBeResolved();
    });

    it('does not bail out altogether if one of the specs does not exist', function () {
        testJasmine.addSpecFiles(['non/existent/file.js']);
        expectAsync(testJasmine.loadSpecs()).toBeResolved();
    });
});
