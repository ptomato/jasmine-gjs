/* global jasmineImporter */

const VerboseReporter = jasmineImporter.verboseReporter;
const Utils = jasmineImporter.utils;

describe('Verbose console reporter', function () {
    let out, reporter, timerSpy, timerSpies;

    beforeEach(function () {
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
        timerSpy = (id) => {
            timerSpies[id] = jasmine.createSpyObj('timer', ['start', 'elapsed']);
            return timerSpies[id];
        };

        reporter = new VerboseReporter.VerboseReporter({
            print: out.print,
            show_colors: false,
            timerFactory: timerSpy,
        });

        // disable indentation for test purposes
        spyOn(Utils, 'indent').and.callFake((str) => str);
    });

    it('reports that the suite has started to the console', function () {
        reporter.jasmineStarted();
        expect(out.getOutput()).toEqual('Started\n\n');
    });

    it('reports a passing spec with a checkmark', function () {
        reporter.specStarted({id: 'foo'});
        reporter.specDone({
            id: 'foo',
            status: 'passed',
            description: 'A passing spec',
        });
        expect(out.getOutput()).toEqual('✓ A passing spec\n');
    });

    it('reports a disabled spec with an "x"', function () {
        reporter.specStarted({id: 'foo'});
        reporter.specDone({
            id: 'foo',
            status: 'disabled',
            description: 'A disabled spec',
        });
        expect(out.getOutput()).toEqual('x A disabled spec\n');
    });

    it('reports a failing spec with a number', function () {
        reporter.specStarted({id: 'foo'});
        reporter.specDone({
            id: 'foo',
            status: 'failed',
            description: 'A failing spec',
        });
        expect(out.getOutput()).toEqual('1) A failing spec\n');
    });

    it('reports a failing spec with the number of that failure in sequence', function () {
        reporter.specStarted({id: 'foo'});
        reporter.specDone({
            id: 'foo',
            status: 'failed',
            description: 'A failing spec',
        });
        out.clear();
        reporter.specStarted({id: 'bar'});
        reporter.specDone({
            id: 'bar',
            status: 'failed',
            description: 'Another failing spec',
        });
        expect(out.getOutput()).toEqual('2) Another failing spec\n');
    });

    it('reports a pending spec as a dash', function () {
        reporter.specStarted({id: 'foo'});
        reporter.specDone({
            id: 'foo',
            status: 'pending',
            description: 'A pending spec',
        });
        expect(out.getOutput()).toEqual('- A pending spec\n');
    });

    it('reports a summary when done', function () {
        reporter.jasmineStarted();
        reporter.specStarted({id: 'foo'});
        reporter.specDone({
            id: 'foo',
            description: 'A spec',
            status: 'passed',
        });
        reporter.specStarted({id: 'bar'});
        reporter.specDone({
            id: 'bar',
            description: 'A spec',
            status: 'pending',
        });
        reporter.specStarted({id: 'baz'});
        reporter.specDone({
            id: 'baz',
            status: 'failed',
            description: 'with a failing spec',
            fullName: 'A suite with a failing spec',
            failedExpectations: [{
                passed: false,
                message: 'Expected true to be false.',
                expected: false,
                actual: true,
                stack: 'fakeStack\nfakeStack',
            }],
        });

        out.clear();

        timerSpies['main'].elapsed.and.returnValue(100);

        reporter.jasmineDone();

        expect(out.getOutput()).toMatch(/1 passing \(0.1 s\)/);
        expect(out.getOutput()).toMatch(/1 pending/);
        expect(out.getOutput()).toMatch(/1 failing/);
    });

    it('reports a summary when done even if there are no specs', function () {
        reporter.jasmineStarted();
        timerSpies['main'].elapsed.and.returnValue(100);
        out.clear();
        reporter.jasmineDone();
        expect(out.getOutput()).toMatch(/0 passing \(0.1 s\)/);
    });

    it('reports a summary when done that includes the failed spec number before the full name of a failing spec', function () {
        reporter.jasmineStarted();
        reporter.specStarted({id: 'foo'});
        reporter.specDone({
            id: 'foo',
            description: 'A spec',
            status: 'passed',
        });
        reporter.specStarted({id: 'bar'});
        reporter.specDone({
            id: 'bar',
            status: 'failed',
            description: 'with a failing spec',
            fullName: 'A suite with a failing spec',
            failedExpectations: [{
                passed: false,
                message: 'Expected true to be false.',
                expected: false,
                actual: true,
                stack: 'fakeStack\nfakeStack',
            }],
        });

        out.clear();

        reporter.jasmineDone();

        expect(out.getOutput()).toMatch(/1\) A suite with a failing spec/);
    });

    it('prints a warning when a spec takes over 40 ms', function () {
        reporter.specStarted({id: 'foo'});
        timerSpies['spec:foo'].elapsed.and.returnValue(50);
        reporter.specDone({
            id: 'foo',
            description: 'A spec',
            status: 'passed',
        });

        expect(out.getOutput()).toMatch('(50 ms)');
    });

    it('prints the reason for a pending spec', function () {
        reporter.specStarted({id: 'foo'});
        reporter.specDone({
            id: 'foo',
            status: 'pending',
            description: 'a pending spec',
            pendingReason: 'it was not ready',
        });
        expect(out.getOutput()).toMatch('(it was not ready)');
    });

    describe('with color', function () {
        beforeEach(function () {
            reporter = new VerboseReporter.VerboseReporter({
                print: out.print,
                showColors: true,
                timerFactory: timerSpy,
            });
        });

        it('reports that the suite has started to the console', function () {
            reporter.jasmineStarted();
            expect(out.getOutput()).toEqual('Started\n\n');
        });

        it('reports a passing spec with a checkmark', function () {
            reporter.specStarted({id: 'foo'});
            reporter.specDone({
                id: 'foo',
                status: 'passed',
                description: 'A passing spec',
            });
            expect(out.getOutput()).toEqual('\x1b[32m✓\x1b[0m A passing spec\n');
        });

        it('reports a disabled spec with an "x"', function () {
            reporter.specStarted({id: 'foo'});
            reporter.specDone({
                id: 'foo',
                status: 'disabled',
                description: 'A disabled spec',
            });
            expect(out.getOutput()).toEqual('x A disabled spec\n');
        });

        it('reports a failing spec with a number', function () {
            reporter.specStarted({id: 'foo'});
            reporter.specDone({
                id: 'foo',
                status: 'failed',
                description: 'A failing spec',
            });
            expect(out.getOutput()).toEqual('\x1b[31m1)\x1b[0m A failing spec\n');
        });

        it('reports a disabled suite with "disabled"', function () {
            reporter.suiteDone({
                status: 'disabled',
                description: 'A disabled suite',
            });
            expect(out.getOutput()).toEqual('\x1b[33m(disabled)\x1b[0m\n');
        });

        it('prints a mild warning when a spec takes over 40 ms', function () {
            reporter.specStarted({id: 'foo'});
            timerSpies['spec:foo'].elapsed.and.returnValue(50);
            reporter.specDone({
                id: 'foo',
                description: 'A spec',
                status: 'passed',
            });

            expect(out.getOutput()).toMatch(/\x1b\[33m\(50 ms\)\x1b\[0m/);
        });

        it('prints a loud warning when a spec takes over 75 ms', function () {
            reporter.specStarted({id: 'foo'});
            timerSpies['spec:foo'].elapsed.and.returnValue(80);
            reporter.specDone({
                id: 'foo',
                description: 'A spec',
                status: 'passed',
            });

            expect(out.getOutput()).toMatch(/\x1b\[31m\(80 ms\)\x1b\[0m/);
        });

        it('prints a pending reason in yellow', function () {
            reporter.specStarted({id: 'foo'});
            reporter.specDone({
                id: 'foo',
                status: 'pending',
                description: 'a pending spec',
                pendingReason: 'it was not ready',
            });
            expect(out.getOutput()).toMatch(/\x1b\[33m\(it was not ready\)\x1b\[0m/);
        });
    });

    it('displays all afterAll exceptions', function () {
        reporter.suiteDone({
            status: 'failed',
            failedExpectations: [{ message: 'After All Exception' }],
        });
        reporter.suiteDone({
            status: 'failed',
            failedExpectations: [{ message: 'Some Other Exception' }],
        });
        reporter.jasmineDone();

        expect(out.getOutput()).toMatch(/After All Exception/);
        expect(out.getOutput()).toMatch(/Some Other Exception/);
    });
});
