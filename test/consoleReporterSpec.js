const ConsoleReporter = imports.consoleReporter;

describe('Console reporter base class', function () {
    let reporter, timerSpy;
    let jasmineCorePath = 'path/to/jasmine/core/jasmine.js';

    beforeEach(function () {
        timerSpy = jasmine.createSpyObj('timer', ['start']);
        reporter = new ConsoleReporter.ConsoleReporter({
            timer: timerSpy,
            jasmineCorePath: jasmineCorePath,
        });
    });

    it('starts the provided timer when jasmine starts', function () {
        reporter.jasmineStarted();
        expect(timerSpy.start).toHaveBeenCalled();
    });

    it('purges Jasmine internals from stack traces', function () {
        let fakeStack = [
            'foo' + jasmineCorePath,
            'bar ' + jasmineCorePath,
            'line of useful stack trace',
            'baz ' + jasmineCorePath,
        ].join('\n');
        let stackTrace = reporter.filterStack(fakeStack);
        expect(stackTrace).toMatch('line of useful stack trace');
        expect(stackTrace).not.toMatch(jasmineCorePath);
    });

    describe('onComplete callback', function () {
        let onComplete, reporter;

        beforeEach(function () {
            onComplete = jasmine.createSpy('onComplete');
            reporter = new ConsoleReporter.ConsoleReporter({
                onComplete: onComplete,
            });
            reporter.jasmineStarted();
        });

        it('is called when the suite is done', function () {
            reporter.jasmineDone();
            expect(onComplete).toHaveBeenCalledWith(true);
        });

        it('is called with false if there are spec failures', function () {
            reporter.specDone({status: 'failed', failedExpectations: []});
            reporter.jasmineDone();
            expect(onComplete).toHaveBeenCalledWith(false);
        });

        it('is called with false if there are suite failures', function () {
            reporter.specDone({status: 'passed'});
            reporter.suiteDone({failedExpectations: [{ message: 'bananas' }] });
            reporter.jasmineDone();
            expect(onComplete).toHaveBeenCalledWith(false);
        });
    });
});
