const ConsoleReporter = imports.consoleReporter;

describe('Verbose console reporter', function () {
    let out, reporter, timerSpy;

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

        timerSpy = jasmine.createSpyObj('timer', ['start', 'elapsed']);

        reporter = new ConsoleReporter.VerboseReporter({
            print: out.print,
            show_colors: false,
            timer: timerSpy,
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
        expect(out.getOutput()).toEqual('  ✓ A passing spec\n');
    });

    it('reports a disabled spec with an "x"', function () {
        reporter.specDone({
            status: 'disabled',
            description: 'A disabled spec',
        });
        expect(out.getOutput()).toEqual('  x A disabled spec\n');
    });

    it('reports a failing spec with a number', function () {
        reporter.specDone({
            status: 'failed',
            description: 'A failing spec',
        });
        expect(out.getOutput()).toEqual('  1) A failing spec\n');
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
        expect(out.getOutput()).toEqual('  2) Another failing spec\n');
    });

    it('reports a pending spec as a dash', function () {
        reporter.specDone({
            status: 'pending',
            description: 'A pending spec',
        });
        expect(out.getOutput()).toEqual('  - A pending spec\n');
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

        timerSpy.elapsed.and.returnValue(100);

        reporter.jasmineDone();

        expect(out.getOutput()).toMatch(/1 passing \(0.1 s\)/);
        expect(out.getOutput()).toMatch(/1 pending/);
        expect(out.getOutput()).toMatch(/1 failing/);
    });

    it('reports a summary when done even if there are no specs', function () {
        reporter.jasmineStarted();
        timerSpy.elapsed.and.returnValue(100);
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

    describe('with color', function () {
        beforeEach(function () {
            reporter = new ConsoleReporter.VerboseReporter({
                print: out.print,
                showColors: true
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
            expect(out.getOutput()).toEqual('  \x1b[32m✓\x1b[0m A passing spec\n');
        });

        it('reports a disabled spec with an "x"', function () {
            reporter.specDone({
                status: 'disabled',
                description: 'A disabled spec',
            });
            expect(out.getOutput()).toEqual('  x A disabled spec\n');
        });

        it('reports a failing spec with a number', function () {
            reporter.specDone({
                status: 'failed',
                description: 'A failing spec',
            });
            expect(out.getOutput()).toEqual('  \x1b[31m1)\x1b[0m A failing spec\n');
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
