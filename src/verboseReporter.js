/* global jasmineImporter */
/* exported VerboseReporter */

const {GObject} = imports.gi;

const {ConsoleReporter} = jasmineImporter.consoleReporter;
const {indenter} = jasmineImporter.utils;

const GRAY = '\x1b[38;5;246m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';

// This reporter, activated with --verbose on the command line, behaves very
// similarly to Mocha's nicely formatted reporter.
var VerboseReporter = GObject.registerClass(class VerboseReporter extends ConsoleReporter {
    jasmineStarted(info) {
        super.jasmineStarted(info);
        this._print('Started\n\n');
    }

    jasmineDone() {
        this._print('\n');
        this._failedSpecs.forEach(this._printSpecFailureDetails, this);
        const seconds = Math.round(this.elapsedTime('main')) / 1000;

        this._print(this._color(`  ${this._passingCount} passing`, GREEN));
        this._print(` (${seconds} s)\n`);
        if (this._pendingCount > 0)
            this._print(this._color(`  ${this._pendingCount} pending\n`, YELLOW));
        if (this._failureCount > 0)
            this._print(this._color(`  ${this._failureCount} failing\n`, RED));
        this._print('\n');

        this._failedSuites.forEach(this._printSuiteFailureDetails, this);

        super.jasmineDone();
    }

    suiteStarted(result) {
        super.suiteStarted(result);
        this._print(indenter.indent(this._color(result.description, GRAY),
            this._suiteLevel * 2));
        this._print('\n');
    }

    suiteDone(result) {
        if (result.status === 'disabled') {
            this._print(indenter.indent(`${this._color('(disabled)', YELLOW)}\n`,
                this._suiteLevel * 2 + 2));
        }

        super.suiteDone(result);

        if (this._suiteLevel === 0)
            this._print('\n');
    }

    specDone(result) {
        super.specDone(result);

        const colors = {
            passed: GREEN,
            pending: YELLOW,
            failed: RED,
            disabled: undefined,
        };
        const symbols = {
            passed: '✓',
            pending: '-',
            failed: `${this._failureCount})`,
            disabled: 'x',
        };
        this._print(indenter.indent(this._color(symbols[result.status],
            colors[result.status]), this._suiteLevel * 2 + 2));
        this._print(` ${result.description}`);
        if (result.time > 75)
            this._print(` ${this._color(`(${result.time} ms)`, RED)}`);
        else if (result.time > 40)
            this._print(` ${this._color(`(${result.time} ms)`, YELLOW)}`);
        if (result.pendingReason)
            this._print(` ${this._color(`(${result.pendingReason})`, YELLOW)}`);
        this._print('\n');
    }

    _printSpecFailureDetails(result, index) {
        this._print(this._color(`${index + 1}) ${result.fullName}\n\n`, RED));

        result.failedExpectations.forEach(failedExpectation => {
            this._print(indenter.indent(this._color(failedExpectation.message, GRAY), 2));
            this._print('\n');
            this._print(indenter.indent(this.filterStack(failedExpectation.stack), 4));
            this._print('\n\n');
        });
    }

    _printSuiteFailureDetails(result) {
        result.failedExpectations.forEach(failedExpectation => {
            this._print(this._color(`An error was thrown in an afterAll
AfterAll ${failedExpectation.message}`, RED));
        });
    }
});
