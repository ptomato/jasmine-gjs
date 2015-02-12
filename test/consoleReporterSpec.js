const ConsoleReporter = imports.consoleReporter;

describe('Console reporter base class', function () {
    let reporter, timerSpies;
    let jasmineCorePath = 'path/to/jasmine/core/jasmine.js';

    beforeEach(function () {
        timerSpies = {};
        let timerSpy = (id) => {
            timerSpies[id] = jasmine.createSpyObj('timer', ['start', 'elapsed']);
            return timerSpies[id];
        };
        reporter = new ConsoleReporter.ConsoleReporter({
            timerFactory: timerSpy,
            jasmineCorePath: jasmineCorePath,
        });
    });

    it('can be instantiated', function () {
        reporter = new ConsoleReporter.ConsoleReporter();
    });

    it('starts the main timer when Jasmine starts', function () {
        reporter.jasmineStarted();
        expect(timerSpies['main'].start).toHaveBeenCalled();
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

    it('starts a timer', function () {
        reporter.startTimer('foobar');
        expect(timerSpies['foobar'].start).toHaveBeenCalled();
    });

    it('gets the elapsed time from a timer', function () {
        reporter.startTimer('foobar');
        timerSpies['foobar'].elapsed.and.returnValue(500);
        expect(reporter.elapsedTime('foobar')).toBe(500);
    });
});
