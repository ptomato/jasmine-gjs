// Reporter that outputs according to the Test Anything Protocol
// See http://testanything.org/tap-specification.html

import GObject from 'gi://GObject';

import {ConsoleReporter} from './consoleReporter.js';

export const TapReporter = GObject.registerClass(class TapReporter extends ConsoleReporter {
    jasmineStarted(info) {
        super.jasmineStarted(info);
        this._print(`1..${info.totalSpecsDefined}\n`);
    }

    jasmineDone() {
        this._failedSuites.forEach(failure => {
            failure.failedExpectations.forEach(result => {
                this._print(`not ok - An error was thrown in an afterAll(): ${result.message}\n`);
            });
        });
        super.jasmineDone();
    }

    suiteStarted(result) {
        super.suiteStarted(result);
        this._print(`# Suite started: ${result.fullName}\n`);
    }

    suiteDone(result) {
        super.suiteDone(result);
        if (result.status === 'disabled') {
            this._print(`# Suite was disabled: ${result.fullName}\n`);
        } else {
            const failures = result.failedExpectations.length;
            this._print(`# Suite finished with ${failures} failure${failures === 1 ? '' : 's'}: ${result.fullName}\n`);
        }
    }

    specDone(result) {
        super.specDone(result);

        if (result.status === 'failed')
            this._print('not ok');
        else
            this._print('ok');
        this._print(` ${this._specCount} - ${result.fullName}`);
        if (result.status === 'pending' || result.status === 'disabled') {
            const reason = result.pendingReason || result.status;
            this._print(` # SKIP ${reason}`);
        }
        if (result.status === 'failed' && result.failedExpectations) {
            const messages = result.failedExpectations.map(r => _removeNewlines(r.message)).join(' ');
            this._print(` (${messages})`);
        }
        this._print('\n');

        // Print additional diagnostic info on failure
        if (result.status === 'failed' && result.failedExpectations) {
            result.failedExpectations.forEach(failedExpectation => {
                this._print(`# Message: ${_removeNewlines(failedExpectation.message)}\n`);
                this._print('# Stack:\n');
                const stackTrace = this.filterStack(failedExpectation.stack).trim();
                this._print(stackTrace.split('\n').map(str => `#   ${str}`).join('\n'));
                this._print('\n');
            });
        }
    }
});

function _removeNewlines(str) {
    const allNewlines = /\n/g;
    return str.replace(allNewlines, '\\n');
}
