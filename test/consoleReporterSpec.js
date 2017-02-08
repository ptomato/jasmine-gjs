/* global jasmineImporter */

const ConsoleReporter = jasmineImporter.consoleReporter;

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

    describe('started signal', function () {
        let reporter;

        beforeEach(function () {
            reporter = new ConsoleReporter.ConsoleReporter();
        });

        it('is emitted when the suite starts', function (done) {
            reporter.connect('started', () => done());
            reporter.jasmineStarted();
        });
    });

    describe('complete signal', function () {
        let reporter;

        beforeEach(function () {
            reporter = new ConsoleReporter.ConsoleReporter();
            reporter.jasmineStarted();
        });

        it('is emitted with true when the suite is done', function (done) {
            reporter.connect('complete', (reporter, success) => {
                expect(success).toBeTruthy();
                done();
            });
            reporter.jasmineDone();
        });

        it('is emitted with false if there are spec failures', function (done) {
            reporter.connect('complete', (reporter, success) => {
                expect(success).toBeFalsy();
                done();
            });
            reporter.specDone({status: 'failed', failedExpectations: []});
            reporter.jasmineDone();
        });

        it('is emitted with false if there are suite failures', function (done) {
            reporter.connect('complete', (reporter, success) => {
                expect(success).toBeFalsy();
                done();
            });
            reporter.specDone({status: 'passed'});
            reporter.suiteDone({failedExpectations: [{ message: 'bananas' }] });
            reporter.jasmineDone();
        });
    });

    it('times individual suites', function () {
        let suiteInfo = {id: 'foo'};
        reporter.suiteStarted(suiteInfo);
        expect(timerSpies['suite:foo'].start).toHaveBeenCalled();

        timerSpies['suite:foo'].elapsed.and.returnValue(800);
        reporter.suiteDone(suiteInfo);
        expect(suiteInfo.time).toBe(800);
    });

    it('times individual specs', function () {
        let specInfo = {
            id: 'foo',
            status: 'passed',
        };
        reporter.specStarted(specInfo);
        expect(timerSpies['spec:foo'].start).toHaveBeenCalled();

        timerSpies['spec:foo'].elapsed.and.returnValue(800);
        reporter.specDone(specInfo);
        expect(specInfo.time).toBe(800);
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
