/* global jasmineImporter */
/* exported DefaultReporter */

const Format = imports.format;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const Utils = jasmineImporter.utils;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;
String.prototype.format = Format.format;

const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const NORMAL = '\x1b[0m';

function createNoopTimer() {
    return {
        start: function () {},
        elapsed: function () { return 0; },
    };
}

var ConsoleReporter = new Lang.Class({
    Name: 'ConsoleReporter',
    Extends: GObject.Object,

    Properties: {
        'show-colors': GObject.ParamSpec.boolean('show-colors', 'Show colors',
            'Whether to print color output',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            true),
        'jasmine-core-path': GObject.ParamSpec.string('jasmine-core-path',
            'Jasmine core path',
            'Path to Jasmine core module for stack trace purposes',
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT_ONLY,
            '/nowhere'),
    },

    Signals: {
        'started': {},
        'complete': {
            param_types: [GObject.TYPE_BOOLEAN],
        },
    },

    _init: function (props={}) {
        if (props.hasOwnProperty('print')) {
            this._print = props.print;
            delete props.print;
        }

        this._timerFactory = createNoopTimer;
        if (props.hasOwnProperty('timerFactory')) {
            this._timerFactory = props.timerFactory;
            delete props.timerFactory;
        }

        this.parent(props);

        // The main timer should return 0 if the run hasn't started yet
        this._timers = {
            'main': createNoopTimer(),
        };

        this._failedSpecs = [];
        this._failedSuites = [];
        this._suiteLevel = 0;
        this._specCount = 0;
        this._passingCount = 0;
        this._failureCount = 0;
        this._pendingCount = 0;
    },

    _color: function (str, color) {
        if (typeof color !== 'undefined')
            return this.show_colors? color + str + NORMAL : str;
        return str;
    },

    // default print function that prints to stdout (GJS' built-in print
    // functions, print() and printerr(), unfortunately append newlines to
    // everything)
    _print: (function () {
        const FD_STDOUT = 1;
        let fdstream = new Gio.UnixOutputStream({
            fd: FD_STDOUT,
            close_fd: false,
        });
        let stdout = new Gio.DataOutputStream({
            base_stream: fdstream,
        });
        return function (str) {
            stdout.put_string(str, null);
        };
    })(),

    // Used to start a timer associated with a particular ID. Subclasses can use
    // this to time actions that the base class doesn't time if they wish.
    startTimer: function (id) {
        this._timers[id] = this._timerFactory(id);
        this._timers[id].start();
    },

    // Used to get the elapsed time from a timer with the given ID. Subclasses
    // can use this to time actions not timed by the base class. The base class
    // uses timers with the following IDs:
    //   main - times the whole suite
    //   suite:foo - times the suite with ID "foo"
    //   spec:bar - times the spec with ID "bar"
    elapsedTime: function (id) {
        return this._timers[id].elapsed();
    },

    // Called with an "info" object with the following property:
    //   totalSpecsDefined - number of specs to be run
    jasmineStarted: function () {
        this.emit('started');
        this.startTimer('main');
    },

    jasmineDone: function () {
        this.elapsedTime('main');  // Stop the timer
        this.emit('complete', this._failureCount === 0);
    },

    // Called with a "result" object with the following properties:
    //   id - a string unique to this suite
    //   description - the name of the suite passed to describe()
    //   fullName - the full name including the names of parent suites
    //   failedExpectations - a list of failures in this suite
    suiteStarted: function (result) {
        if (result.id)
            this.startTimer('suite:' + result.id);
        this._suiteLevel++;
    },

    // Called with the same object as suiteStarted(), with an extra property:
    //   status - "disabled", "failed", or "finished"
    // Adds another extra property if the suite was started properly with ID:
    //   time - time taken to execute the suite, in milliseconds
    suiteDone: function (result) {
        this._suiteLevel--;
        if (result.failedExpectations && result.failedExpectations.length > 0) {
            this._failureCount++;
            this._failedSuites.push(result);
        }
        if (result.id)
            result.time = this.elapsedTime('suite:' + result.id);
    },

    // Called with a "result" object with the following properties:
    //   id - a string unique to this spec
    //   description: the name of the spec passed to it()
    //   fullName - the full name concatenated with the suite's full name
    //   failedExpectations - a list of failures in this spec
    //   passedExpectations - a list of succeeded expectations in this spec
    specStarted: function (result) {
        if (result.id)
            this.startTimer('spec:' + result.id);
        this._specCount++;
    },

    // Called with the same object as specStarted(), with an extra property:
    //   status - "disabled", "pending", "failed", or "passed"
    // Adds another extra property if the spec was started properly with ID:
    //   time - time taken to execute the spec, in milliseconds
    specDone: function (result) {
        if (result.status === 'passed') {
            this._passingCount++;
        } else if (result.status === 'pending') {
            this._pendingCount++;
        } else if (result.status === 'failed') {
            this._failureCount++;
            this._failedSpecs.push(result);
        }
        if (result.id)
            result.time = this.elapsedTime('spec:' + result.id);
    },

    filterStack: function (stack) {
        return stack.split('\n').filter((stackLine) => {
            return stackLine.indexOf(this.jasmine_core_path) === -1;
        }).join('\n');
    },
});

// This reporter has very nearly the same behaviour to Jasmine's default console
// reporter.
var DefaultReporter = new Lang.Class({
    Name: 'DefaultReporter',
    Extends: ConsoleReporter,

    jasmineStarted: function (info) {
        this.parent(info);
        this._print('Started\n');
    },

    jasmineDone: function () {
        this._print('\n\n');
        if (this._failedSpecs.length > 0)
            this._print('Failures:');
        this._failedSpecs.forEach(this._printSpecFailureDetails, this);

        if (this._specCount > 0) {
            this._print('\n');
            this._print('%d %s, %d failed'.format(this._specCount,
                this._specCount === 1 ? 'spec' : 'specs', this._failureCount));

            if (this._pendingCount) {
                this._print(', %d pending'.format(this._pendingCount));
            }
        } else {
            this._print('No specs found');
        }

        this._print('\n');
        let seconds = Math.round(this.elapsedTime('main')) / 1000;
        this._print('\nFinished in %f s\n'.format(seconds));

        this._failedSuites.forEach(this._printSuiteFailureDetails, this);

        this.parent();
    },

    specDone: function (result) {
        this.parent(result);

        const colors = {
            passed: GREEN,
            pending: YELLOW,
            failed: RED,
            disabled: undefined,
        };
        const symbols = {
            passed: '.',
            pending: '*',
            failed: 'F',
            disabled: '',
        };
        this._print(this._color(symbols[result.status], colors[result.status]));
    },

    _printSpecFailureDetails: function (result, index) {
        this._print('\n%d) %s\n'.format(index + 1, result.fullName));
        result.failedExpectations.forEach((failedExpectation) => {
            let report = 'Message:\n' + this._color(failedExpectation.message, RED) +
                '\nStack:\n' + this.filterStack(failedExpectation.stack) + '\n';
            this._print(Utils.indent(report, 2));
        });
    },

    _printSuiteFailureDetails: function (result) {
        result.failedExpectations.forEach((failedExpectation) => {
            this._print(this._color('An error was thrown in an afterAll\n' +
                'AfterAll %s\n'.format(failedExpectation.message), RED));
        });
    },
});
