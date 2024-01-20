// Reporter that outputs a JUnit XML test report
// See http://llg.cubic.org/docs/junit/
// Unfortunately, the JUnit format is woefully underspecified.

import GLib from 'gi://GLib';
import GObject from 'gi://GObject';

import {ConsoleReporter} from './consoleReporter.js';
import * as XMLWriter from './xmlWriter.js';

export const JUnitReporter = GObject.registerClass(class JUnitReporter extends ConsoleReporter {
    jasmineStarted(info) {
        this._currentSuite = null;
        super.jasmineStarted(info);
        this._tree = new XMLWriter.Node('testsuites');
        this._suiteCount = 0;
        this._activeSuites = [];

        const properties = new XMLWriter.Node('properties');
        properties.children = GLib.listenv().map(key => {
            const property = new XMLWriter.Node('property');
            property.attrs = {
                name: key,
                value: GLib.getenv(key),
            };
            return property;
        });
        this._tree.children.push(properties);
    }

    jasmineDone() {
        const failedAfterAlls = this._failedSuites.length;
        if (failedAfterAlls > 0) {
            const afterAllSuite = new XMLWriter.Node('testsuite');
            afterAllSuite.attrs = {
                name: 'afterAll()',
                tests: failedAfterAlls,
                errors: failedAfterAlls,
                id: this._suiteCount++,
            };
            afterAllSuite.children = this._failedSuites.map(failure => {
                const afterAllCase = new XMLWriter.Node('testcase');
                afterAllCase.attrs = {
                    name: failure.description,
                    classname: 'AfterAll',
                    assertions: failure.failedExpectations.length,
                };
                afterAllCase.children = failure.failedExpectations.map(result => {
                    const error = new XMLWriter.Node('error');
                    error.attrs = _parseExceptionMessage(result);
                    error.text = result.stack;
                    return error;
                });
                return afterAllCase;
            });
            this._tree.children.push(afterAllSuite);
        }

        // Timer inherited from ConsoleReporter
        this._tree.attrs = {
            time: this.elapsedTime('main') / 1000,
        };

        this._print(this._tree.toString());

        super.jasmineDone();
    }

    // Jenkins parses nested JUnit test suites but doesn't display them properly.
    // See https://issues.jenkins-ci.org/browse/JENKINS-18673
    // Therefore, we flatten all suites into one level.
    suiteStarted(result) {
        super.suiteStarted(result);
        this._activeSuites.push(this._currentSuite);
        this._currentSuite = new XMLWriter.Node('testsuite');
        this._currentSuite.attrs = {
            name: result.fullName,
            id: this._suiteCount++,
            tests: 0,
            disabled: 0,
            failures: 0,
            errors: 0,
            skipped: 0,
            timestamp: GLib.DateTime.new_now_local().format('%Y-%m-%dT%H:%M:%S'),
        };
        this._tree.children.push(this._currentSuite);
    }

    suiteDone(result) {
        super.suiteDone(result);
        this._currentSuite.attrs.time = result.time / 1000;  // in seconds
        this._currentSuite = this._activeSuites.pop();
    }

    specStarted(result) {
        super.specStarted(result);
        this._currentSuite.attrs.tests++;
    }

    specDone(result) {
        super.specDone(result);

        const spec = new XMLWriter.Node('testcase');
        spec.attrs = {
            name: result.description,
            classname: this._currentSuite.attrs['name'],
            assertions: result.failedExpectations.length +
                result.passedExpectations.length,
            time: result.time / 1000,  // in seconds
        };

        switch (result.status) {
        case 'disabled':
            this._currentSuite.attrs.disabled++;
            return;
        case 'failed': {
            // We count a failure as a "failure" if at least one expectation
            // failed. If there were only uncaught exceptions, then it is an
            // "error".
            let assertFailed = false;
            result.failedExpectations.forEach(failedExpectation => {
                let node;
                if (failedExpectation.matcherName !== '') {
                    assertFailed = true;
                    node = new XMLWriter.Node('failure');
                    node.attrs = {
                        type: failedExpectation.matcherName,
                        message: failedExpectation.message,
                    };
                } else {
                    node = new XMLWriter.Node('error');
                    node.attrs = _parseExceptionMessage(failedExpectation);
                }
                node.text = this.filterStack(failedExpectation.stack);
                spec.children.push(node);
            });
            if (assertFailed)
                this._currentSuite.attrs.failures++;
            else
                this._currentSuite.attrs.errors++;
        }
            break;
        case 'pending':
            this._currentSuite.attrs.skipped++;
            spec.children.push(new XMLWriter.Node('skipped'));
            break;
        }
        this._currentSuite.children.push(spec);
    }
});

function _parseExceptionMessage(expectation) {
    const parse = expectation.message.split(':');
    return {
        type: parse.length > 1 ? parse[0] : 'Error',
        message: expectation.message,
    };
}
