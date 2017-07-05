/* global jasmineImporter */

const GLib = imports.gi.GLib;

const JUnitReporter = jasmineImporter.junitReporter;
const XMLWriter = jasmineImporter.xmlWriter;

const SUITE_INFO = {
    id: 'foo',
    description: 'A suite',
    fullName: 'A suite',
    failedExpectations: [],
    status: 'finished',
};
const NESTED_SUITE_INFO = {
    id: 'baz',
    description: 'nested',
    fullName: 'A suite nested',
    failedExpectations: [],
    status: 'finished',
};
const FAILED_SUITE_INFO = {
    id: 'cheers',
    description: 'A failing suite',
    fullName: 'A failing suite',
    failedExpectations: [{
        matcherName: '',
        message: 'Some error',
        stack: 'file.js:113\nfile.js:72\nfile.js:17\n',
    }],
    status: 'failed',
};
const PASSING_SPEC_INFO = {
    id: 'bar',
    description: 'passes a test',
    fullName: 'A suite passes a test',
    failedExpectations: [],
    passedExpectations: [
        {
            matcherName: 'toBe',
            message: 'Expected true to be true',
        },
        {
            matcherName: 'toContain',
            message: 'Expected [1] to contain 1',
        }
    ],
    status: 'passed',
};
const NESTED_PASSING_SPEC_INFO = {
    id: 'boz',
    description: 'passes a test',
    fullName: 'A suite nested passes a test',
    failedExpectations: [],
    passedExpectations: [],
    status: 'passed',
};
const PENDING_SPEC_INFO = {
    id: 'skip',
    description: 'skips a test',
    fullName: 'A suite skips a test',
    failedExpectations: [],
    passedExpectations: [],
    status: 'pending',
};
const FAILING_SPEC_INFO = {
    id: 'bad',
    description: 'fails a test',
    fullName: 'A suite fails a test',
    failedExpectations: [{
        matcherName: 'toBe',
        message: 'Expected true to be false',
        stack: 'file.js:113\nfile.js:72\nfile.js:17\n',
    }],
    passedExpectations: [],
    status: 'failed',
};
const ERROR_SPEC_INFO = {
    id: 'bug',
    description: 'has a bug in a test',
    fullName: 'A suite has a bug in a test',
    failedExpectations: [
        {
            matcherName: '',
            message: 'TypeError: foo is not a function',
            stack: 'file.js:113\nfile.js:72\nfile.js:17\n',
        },
        {
            matcherName: '',
            message: 'Some other unknown error',
            stack: 'file.js:113\nfile.js:72\nfile.js:17\n',
        },
    ],
    passedExpectations: [],
    status: 'failed',
};
const DISABLED_SPEC_INFO = {
    id: 'wut',
    description: 'disables a test',
    fullName: 'A suite disables a test',
    failedExpectations: [],
    passedExpectations: [],
    status: 'disabled',
};

describe('The JUnit reporter', function () {
    let out, reporter, timerSpies;

    beforeEach(function () {
        // Override the XML outputting function to output JSON instead. This is
        // for ease of verifying the output. XML is inconvenient to parse in the
        // DOM-less GJS. Any regressions in the XML output should not be tested
        // here, but instead should be covered in xmlWriterSpec.js.
        spyOn(XMLWriter.Node.prototype, 'toString').and.callFake(function () {
            return JSON.stringify(this);
        });

        out = (function () {
            let output = '';
            return {
                print: function (str) {
                    output += str;
                },
                getOutput: function () {
                    return output;
                },
                clear: function () {
                    output = '';
                }
            };
        }());

        timerSpies = {};
        let timerSpy = (id) => {
            timerSpies[id] = jasmine.createSpyObj('timer', ['start', 'elapsed']);
            return timerSpies[id];
        };

        reporter = new JUnitReporter.JUnitReporter({
            print: out.print,
            timerFactory: timerSpy,
        });
        reporter.jasmineStarted();
    });

    function runSpec(specInfo) {
        reporter.specStarted(specInfo);
        reporter.specDone(specInfo);
    }

    function runSuite(suiteInfo, specs) {
        reporter.suiteStarted(suiteInfo);
        specs.forEach(runSpec);
        reporter.suiteDone(suiteInfo);
    }

    // Find the <testsuite> element with the given ID inside the <testsuites>
    // element given by tree. This is necessary because other elements may be
    // present such as, <properties>, so we cannot rely on the element with ID 0
    // being the first child of <testsuites>.
    function findSuite(tree, id) {
        for (let index = 0; index < tree.children.length; index++) {
            let child = tree.children[index];
            if (child.name === 'testsuite' && child.attrs['id'] === id)
                return child;
        }
        return undefined;
    }

    // For XML builder reasons, the report is only output at the end of all the
    // test suites. Therefore all tests must call jasmineDone().

    it('outputs a JUnit report', function () {
        reporter.jasmineDone();

        let tree = JSON.parse(out.getOutput());
        expect(tree.name).toBe('testsuites');
    });

    it('reports all required elements of a test suite', function () {
        runSuite(SUITE_INFO, []);
        reporter.jasmineDone();

        let tree = JSON.parse(out.getOutput());
        let testsuite = findSuite(tree, 0);
        expect(testsuite.name).toBe('testsuite');
        expect(testsuite.attrs['name']).toBe('A suite');
        expect(testsuite.attrs['tests']).toBe(0);
    });

    it('reports all required elements of a test case element', function () {
        runSuite(SUITE_INFO, [PASSING_SPEC_INFO]);
        reporter.jasmineDone();

        let tree = JSON.parse(out.getOutput());
        let testsuite = findSuite(tree, 0);
        let testcase = testsuite.children[0];
        expect(testcase.name).toBe('testcase');
        expect(testcase.attrs['name']).toBe('passes a test');
        expect(testcase.attrs['classname']).toBe('A suite');
    });

    it('reports a pending spec as skipped', function () {
        runSuite(SUITE_INFO, [PENDING_SPEC_INFO]);
        reporter.jasmineDone();

        let tree = JSON.parse(out.getOutput());
        let testsuite = findSuite(tree, 0);
        let testcase = testsuite.children[0];
        expect(testcase.children[0].name).toBe('skipped');
    });

    describe('given a spec with a failed expectation', function () {
        let failure;

        beforeEach(function () {
            runSuite(SUITE_INFO, [FAILING_SPEC_INFO]);
            reporter.jasmineDone();

            let tree = JSON.parse(out.getOutput());
            let testsuite = findSuite(tree, 0);
            failure = testsuite.children[0].children[0];
        });

        it('reports it as failed', function () {
            expect(failure.name).toBe('failure');
        });

        it('reports the matcher name as the failure type', function () {
            if (!failure.attrs.hasOwnProperty('type'))
                pending();
            expect(failure.attrs['type']).toBe('toBe');
        });

        it('reports the expectation message', function () {
            if (!failure.attrs.hasOwnProperty('message'))
                pending();
            expect(failure.attrs['message']).toBe('Expected true to be false');
        });

        it('reports the stack trace', function () {
            expect(failure.text).toBe('file.js:113\nfile.js:72\nfile.js:17\n');
        });
    });

    describe('given a spec with an uncaught exception', function () {
        let error1, error2;

        beforeEach(function () {
            runSuite(SUITE_INFO, [ERROR_SPEC_INFO]);
            reporter.jasmineDone();

            let tree = JSON.parse(out.getOutput());
            let testsuite = findSuite(tree, 0);
            error1 = testsuite.children[0].children[0];
            error2 = testsuite.children[0].children[1];
        });

        it('reports it as errored', function () {
            expect(error1.name).toBe('error');
            expect(error2.name).toBe('error');
        });

        it('reports the exception class as the failure type', function () {
            expect(error1.attrs['type']).toBe('TypeError');
        });

        it('picks a default type if the exception class is not known', function () {
            expect(error2.attrs['type']).toBe('Error');
        });

        it('reports the error message', function () {
            expect(error1.attrs['message']).toBe('TypeError: foo is not a function');
            expect(error2.attrs['message']).toBe('Some other unknown error');
        });

        it('reports the stack trace', function () {
            expect(error1.text).toBe('file.js:113\nfile.js:72\nfile.js:17\n');
            expect(error2.text).toBe('file.js:113\nfile.js:72\nfile.js:17\n');
        });
    });

    it('does not report a disabled spec', function () {
        runSuite(SUITE_INFO, [DISABLED_SPEC_INFO]);
        reporter.jasmineDone();

        let tree = JSON.parse(out.getOutput());
        let testsuite = findSuite(tree, 0);
        expect(testsuite.children.length).toBe(0);
    });

    it('gives each suite an increasing ID number', function () {
        runSuite(SUITE_INFO, [PASSING_SPEC_INFO]);
        runSuite(SUITE_INFO, [PASSING_SPEC_INFO]);
        runSuite(SUITE_INFO, [PASSING_SPEC_INFO]);
        reporter.jasmineDone();

        let tree = JSON.parse(out.getOutput());
        tree.children.filter((child) => child.name === 'testsuite')
        .forEach((child, index) => {
            expect(child.attrs['id']).toBe(index);
        });
    });

    it('times all suites together', function () {
        timerSpies['main'].elapsed.and.returnValue(1200);
        reporter.jasmineDone();

        let tree = JSON.parse(out.getOutput());
        expect(tree.attrs['time']).toBeCloseTo(1.2, 4);
    });

    it('times individual suites', function () {
        reporter.suiteStarted(SUITE_INFO);
        timerSpies['suite:' + SUITE_INFO.id].elapsed.and.returnValue(100);
        reporter.suiteDone(SUITE_INFO);
        reporter.jasmineDone();

        let tree = JSON.parse(out.getOutput());
        let testsuite = findSuite(tree, 0);
        expect(testsuite.attrs['time']).toBeCloseTo(0.1, 4);
    });

    it('times individual specs', function () {
        reporter.suiteStarted(SUITE_INFO);
        reporter.specStarted(PASSING_SPEC_INFO);
        timerSpies['spec:' + PASSING_SPEC_INFO.id].elapsed.and.returnValue(100);
        reporter.specDone(PASSING_SPEC_INFO);
        reporter.suiteDone(SUITE_INFO);
        reporter.jasmineDone();

        let tree = JSON.parse(out.getOutput());
        let testsuite = findSuite(tree, 0);
        let testcase = testsuite.children[0];
        expect(testcase.attrs['time']).toBeCloseTo(0.1, 4);
    });

    it('counts all tests in a suite', function () {
        runSuite(SUITE_INFO, [PASSING_SPEC_INFO, PASSING_SPEC_INFO, PASSING_SPEC_INFO]);
        reporter.jasmineDone();

        let tree = JSON.parse(out.getOutput());
        let testsuite = findSuite(tree, 0);
        expect(testsuite.attrs['tests']).toBe(3);
    });

    it('counts disabled tests in a suite', function () {
        runSuite(SUITE_INFO, [PASSING_SPEC_INFO, DISABLED_SPEC_INFO, PASSING_SPEC_INFO]);
        reporter.jasmineDone();

        let tree = JSON.parse(out.getOutput());
        let testsuite = findSuite(tree, 0);
        expect(testsuite.attrs['disabled']).toBe(1);
    });

    it('counts errored tests in a suite', function () {
        runSuite(SUITE_INFO, [PASSING_SPEC_INFO, ERROR_SPEC_INFO, PASSING_SPEC_INFO]);
        reporter.jasmineDone();

        let tree = JSON.parse(out.getOutput());
        let testsuite = findSuite(tree, 0);
        expect(testsuite.attrs['errors']).toBe(1);
    });

    it('counts failed tests in a suite', function () {
        runSuite(SUITE_INFO, [PASSING_SPEC_INFO, FAILING_SPEC_INFO, PASSING_SPEC_INFO]);
        reporter.jasmineDone();

        let tree = JSON.parse(out.getOutput());
        let testsuite = findSuite(tree, 0);
        expect(testsuite.attrs['failures']).toBe(1);
    });

    it('counts skipped tests in a suite', function () {
        runSuite(SUITE_INFO, [PASSING_SPEC_INFO, PENDING_SPEC_INFO, PASSING_SPEC_INFO]);
        reporter.jasmineDone();

        let tree = JSON.parse(out.getOutput());
        let testsuite = findSuite(tree, 0);
        expect(testsuite.attrs['skipped']).toBe(1);
    });

    it('timestamps a suite', function () {
        runSuite(SUITE_INFO, []);
        reporter.jasmineDone();

        let tree = JSON.parse(out.getOutput());
        let testsuite = findSuite(tree, 0);
        expect(() => Date.parse(testsuite.attrs['timestamp'])).not.toThrow();
    });

    it('flattens nested suites', function () {
        reporter.suiteStarted(SUITE_INFO);
        [PASSING_SPEC_INFO, PASSING_SPEC_INFO].forEach(runSpec);
        reporter.suiteStarted(NESTED_SUITE_INFO);
        [NESTED_PASSING_SPEC_INFO, NESTED_PASSING_SPEC_INFO].forEach(runSpec);
        reporter.suiteDone(NESTED_SUITE_INFO);
        runSpec(PASSING_SPEC_INFO);
        reporter.suiteDone(SUITE_INFO);
        reporter.jasmineDone();

        let tree = JSON.parse(out.getOutput());
        let suite1 = findSuite(tree, 0);
        let suite2 = findSuite(tree, 1);
        expect(suite1.attrs['tests']).toBe(3);
        expect(suite2.attrs['tests']).toBe(2);
    });

    it('reports exceptions in afterAll() as errors in a separate suite', function () {
        runSuite(FAILED_SUITE_INFO, [PASSING_SPEC_INFO]);
        reporter.jasmineDone();

        let tree = JSON.parse(out.getOutput());
        let afterAllSuite = findSuite(tree, 1);
        expect(afterAllSuite.attrs['tests']).toBe(1);
        expect(afterAllSuite.attrs['errors']).toBe(1);
    });

    it('reports an error in afterAll() as a test case', function () {
        runSuite(FAILED_SUITE_INFO, [PASSING_SPEC_INFO]);
        reporter.jasmineDone();

        let tree = JSON.parse(out.getOutput());
        let afterAllSuite = findSuite(tree, 1);
        expect(afterAllSuite.children[0]).toEqual(jasmine.objectContaining({
            name: 'testcase',
            attrs: jasmine.any(Object),
            children: [jasmine.objectContaining({
                name: 'error',
                attrs: jasmine.objectContaining({
                    message: 'Some error',
                    type: 'Error',
                }),
                text: 'file.js:113\nfile.js:72\nfile.js:17\n',
            })],
        }));
    });

    it('adds the environment in a <properties> element', function () {
        GLib.setenv('JASMINE_TESTS_BOGUS_VARIABLE', 'surprise', true);
        reporter.jasmineStarted(); // restart
        reporter.jasmineDone();

        let tree = JSON.parse(out.getOutput());
        let properties = tree.children.filter((child) => child.name === 'properties')[0];
        expect(properties.children).toContain(jasmine.objectContaining({
            name: 'property',
            attrs: {
                name: 'JASMINE_TESTS_BOGUS_VARIABLE',
                value: 'surprise',
            },
        }));
    });

    it('reports the total number of assertions', function () {
        runSuite(SUITE_INFO, [PASSING_SPEC_INFO, ERROR_SPEC_INFO]);
        reporter.jasmineDone();

        let tree = JSON.parse(out.getOutput());
        let testsuite = findSuite(tree, 0);
        expect(testsuite.children[0].attrs['assertions']).toBe(2);
        expect(testsuite.children[1].attrs['assertions']).toBe(2);
    });

    it('reports the total number of assertions in an afterAll() suite', function () {
        runSuite(FAILED_SUITE_INFO, [PASSING_SPEC_INFO]);
        reporter.jasmineDone();

        let tree = JSON.parse(out.getOutput());
        let afterAllSuite = findSuite(tree, 1);
        expect(afterAllSuite.children[0].attrs['assertions']).toBe(1);
    });
});
