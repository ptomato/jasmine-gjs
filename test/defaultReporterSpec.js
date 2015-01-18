const ConsoleReporter = imports.consoleReporter;

describe('Default console reporter', function () {
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

        reporter = new ConsoleReporter.DefaultReporter({
            print: out.print,
            show_colors: false,
            timer: timerSpy,
        });
    });

    it('reports that the suite has started to the console', function () {
        reporter.jasmineStarted();
        expect(out.getOutput()).toEqual('Started\n');
    });

    it('reports a passing spec as a dot', function () {
        reporter.specDone({status: 'passed'});
        expect(out.getOutput()).toEqual('.');
    });

    it('does not report a disabled spec', function () {
        reporter.specDone({status: 'disabled'});
        expect(out.getOutput()).toEqual('');
    });

    it('reports a failing spec as an "F"', function () {
        reporter.specDone({status: 'failed'});
        expect(out.getOutput()).toEqual('F');
    });

    it('reports a pending spec as a "*"', function () {
        reporter.specDone({status: 'pending'});
        expect(out.getOutput()).toEqual('*');
    });

    it('alerts user if there are no specs', function () {
        reporter.jasmineStarted();
        out.clear();
        reporter.jasmineDone();
        expect(out.getOutput()).toMatch(/No specs found/);
    });

    it('reports a summary when done (singular spec)', function () {
        reporter.jasmineStarted();
        reporter.specStarted({});
        reporter.specDone({status: 'passed'});

        timerSpy.elapsed.and.returnValue(1000);

        out.clear();
        reporter.jasmineDone();

        expect(out.getOutput()).toMatch(/1 spec, 0 failed/);
        expect(out.getOutput()).not.toMatch(/0 pending/);
        expect(out.getOutput()).toMatch('Finished in 1 s\n');
    });

    it('reports a summary when done (pluralized specs)', function () {
        reporter.jasmineStarted();
        reporter.specStarted({});
        reporter.specDone({status: 'passed'});
        reporter.specStarted({});
        reporter.specDone({status: 'pending'});
        reporter.specStarted({});
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

        expect(out.getOutput()).toMatch(/3 specs, 1 failed, 1 pending/);
        expect(out.getOutput()).toMatch('Finished in 0.1 s\n');
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
            reporter = new ConsoleReporter.DefaultReporter({
                print: out.print,
                showColors: true
            });
        });

        it('reports that the suite has started to the console', function () {
            reporter.jasmineStarted();
            expect(out.getOutput()).toEqual('Started\n');
        });

        it('reports a passing spec as a dot', function () {
            reporter.specDone({status: 'passed'});
            expect(out.getOutput()).toEqual('\x1B[32m.\x1B[0m');
        });

        it('does not report a disabled spec', function () {
            reporter.specDone({status: 'disabled'});
            expect(out.getOutput()).toEqual('');
        });

        it('reports a failing spec as an "F"', function () {
            reporter.specDone({status: 'failed'});
            expect(out.getOutput()).toEqual('\x1B[31mF\x1B[0m');
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
