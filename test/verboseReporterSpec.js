/* global jasmineImporter */

const VerboseReporter = jasmineImporter.verboseReporter;

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
        spyOn(VerboseReporter.Utils, 'indent').and.callFake((str) => str);
    });

    it('reports that the suite has started to the console', function () {
        reporter.jasmineStarted();
        expect(out.getOutput()).toEqual('Started\n\n');
    });

    it('reports a passing spec with a checkmark', function () {
        reporter.specDone({
            status: 'passed',
            description: 'A passing spec',
        });
        expect(out.getOutput()).toEqual('✓ A passing spec\n');
    });

    it('reports a disabled spec with an "x"', function () {
        reporter.specDone({
            status: 'disabled',
            description: 'A disabled spec',
        });
        expect(out.getOutput()).toEqual('x A disabled spec\n');
    });

    it('reports a failing spec with a number', function () {
        reporter.specDone({
            status: 'failed',
            description: 'A failing spec',
        });
        expect(out.getOutput()).toEqual('1) A failing spec\n');
    });

    it('reports a failing spec with the number of that failure in sequence', function () {
        reporter.specDone({
            status: 'failed',
            description: 'A failing spec',
        });
        out.clear();
        reporter.specDone({
            status: 'failed',
            description: 'Another failing spec',
        });
        expect(out.getOutput()).toEqual('2) Another failing spec\n');
    });

    it('reports a pending spec as a dash', function () {
        reporter.specDone({
            status: 'pending',
            description: 'A pending spec',
        });
        expect(out.getOutput()).toEqual('- A pending spec\n');
    });

    it('reports a summary when done', function () {
        reporter.jasmineStarted();
        reporter.specDone({status: 'passed'});
        reporter.specDone({status: 'pending'});
        reporter.specDone({
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
        reporter.specDone({status: 'passed'});
        reporter.specDone({
            status: 'failed',
            description: 'with a failing spec',
            fullName: 'A suite with a failing spec',
            failedExpectations: [{
                passed: false,
                message: 'Expected true to be false.',
                expected: false,
                actual: true,
                stack: 'fakeStack\nfakeStack',
            }]
        });

        out.clear();

        reporter.jasmineDone();

        expect(out.getOutput()).toMatch(/1\) A suite with a failing spec/);
    });

    it('prints a warning when a spec takes over 40 ms', function () {
        reporter.specStarted({id: 'foo'});
        timerSpies['spec:foo'].elapsed.and.returnValue(50);
        reporter.specDone({id: 'foo'});

        expect(out.getOutput()).toMatch('(50 ms)');
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
            reporter.specDone({
                status: 'passed',
                description: 'A passing spec',
            });
            expect(out.getOutput()).toEqual('\x1b[32m✓\x1b[0m A passing spec\n');
        });

        it('reports a disabled spec with an "x"', function () {
            reporter.specDone({
                status: 'disabled',
                description: 'A disabled spec',
            });
            expect(out.getOutput()).toEqual('x A disabled spec\n');
        });

        it('reports a failing spec with a number', function () {
            reporter.specDone({
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
            reporter.specDone({id: 'foo'});

            expect(out.getOutput()).toMatch(/\x1b\[33m\(50 ms\)\x1b\[0m/);
        });

        it('prints a loud warning when a spec takes over 75 ms', function () {
            reporter.specStarted({id: 'foo'});
            timerSpies['spec:foo'].elapsed.and.returnValue(80);
            reporter.specDone({id: 'foo'});

            expect(out.getOutput()).toMatch(/\x1b\[31m\(80 ms\)\x1b\[0m/);
        });
    });

    it('displays all afterAll exceptions', function () {
        reporter.suiteDone({ failedExpectations: [{ message: 'After All Exception' }] });
        reporter.suiteDone({ failedExpectations: [{ message: 'Some Other Exception' }] });
        reporter.jasmineDone();

        expect(out.getOutput()).toMatch(/After All Exception/);
        expect(out.getOutput()).toMatch(/Some Other Exception/);
    });
});
