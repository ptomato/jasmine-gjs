/* global jasmineImporter */

const TapReporter = jasmineImporter.tapReporter;

describe('The TAP reporter', function () {
    let out, reporter;

    beforeEach(function () {
        out = (function () {
            let output = '';
            return {
                print(str) {
                    output += str;
                },
                getOutput() {
                    return output;
                },
                clear() {
                    output = '';
                },
            };
        })();

        reporter = new TapReporter.TapReporter({
            print: out.print,
        });
    });

    it('outputs a test plan', function () {
        reporter.jasmineStarted({totalSpecsDefined: 1});
        reporter.specStarted({});
        reporter.specDone({
            fullName: 'foo',
            status: 'passed',
        });
        reporter.jasmineDone();

        expect(out.getOutput()).toMatch(/1../);
    });

    it('includes the total number of specs in the test plan', function () {
        reporter.jasmineStarted({totalSpecsDefined: 2});
        reporter.specStarted({});
        reporter.specDone({
            fullName: 'foo',
            status: 'passed',
        });
        reporter.specStarted({});
        reporter.specDone({
            fullName: 'bar',
            status: 'passed',
        });
        reporter.jasmineDone();

        expect(out.getOutput()).toMatch(/1..2/);
    });

    it('outputs an empty test plan if there were no specs', function () {
        reporter.jasmineStarted({totalSpecsDefined: 0});
        reporter.jasmineDone();

        expect(out.getOutput()).toMatch(/1..0/);
    });

    it('outputs a line starting with "ok" for a passing spec', function () {
        reporter.specStarted({});
        reporter.specDone({
            fullName: 'foo',
            status: 'passed',
        });
        expect(out.getOutput()).toMatch(/^ok/);
    });

    it('outputs a line starting with "not ok" for a failing spec', function () {
        reporter.specStarted({});
        reporter.specDone({
            fullName: 'foo',
            status: 'failed',
        });
        expect(out.getOutput()).toMatch(/^not ok/);
    });

    it('outputs an "ok" line plus a skip directive for a pending spec', function () {
        reporter.specStarted({});
        reporter.specDone({
            fullName: 'foo',
            status: 'pending',
        });
        expect(out.getOutput()).toMatch(/^ok/);
        expect(out.getOutput()).toMatch(/# skip/i);
    });

    it('reports the reason for a pending spec, if given', function () {
        reporter.specStarted({});
        reporter.specDone({
            fullName: 'foo',
            status: 'pending',
            pendingReason: 'because I said so',
        });
        expect(out.getOutput()).toMatch('because I said so');
    });

    it('outputs an "ok" line plus a skip directive for a disabled spec', function () {
        reporter.specStarted({});
        reporter.specDone({
            fullName: 'foo',
            status: 'disabled',
        });
        expect(out.getOutput()).toMatch(/^ok/);
        expect(out.getOutput()).toMatch(/# skip/i);
    });

    it('outputs a sequence number after the result', function () {
        reporter.specStarted({});
        reporter.specDone({
            fullName: 'foo',
            status: 'passed',
        });
        expect(out.getOutput()).toMatch(/^ok 1/);
        out.clear();
        reporter.specStarted({});
        reporter.specDone({
            fullName: 'bar',
            status: 'failed',
        });
        expect(out.getOutput()).toMatch(/^not ok 2/);
    });

    it('outputs the name of the spec on the test line', function () {
        reporter.specStarted({});
        reporter.specDone({
            status: 'passed',
            fullName: 'A passing spec',
        });
        expect(out.getOutput()).toMatch(/^ok.*A passing spec/);
        out.clear();
        reporter.specStarted({});
        reporter.specDone({
            status: 'failed',
            fullName: 'A failing spec',
        });
        expect(out.getOutput()).toMatch(/^not ok.*A failing spec/);
    });

    it('does not let the name start with a digit', function () {
        reporter.specStarted({});
        reporter.specDone({
            status: 'passed',
            fullName: '3 careless programmers wrote this',
        });
        expect(out.getOutput()).toMatch(/^ok 1/);
        expect(out.getOutput()).not.toMatch(/^ok 1\s*[0-9]+/);
    });

    describe('on failure', function () {
        beforeEach(function () {
            reporter.specStarted({});
            out.clear();
            reporter.specDone({
                fullName: 'foo',
                status: 'failed',
                failedExpectations: [
                    {
                        message: 'Expected the earth and the sky.',
                        stack: 'line 1\nline 2\nline 3',
                    },
                    {
                        message: 'Expectations exceeded.',
                        stack: 'line 4\nline 5',
                    },
                ],
            });
        });

        it('outputs messages on the test line', function () {
            let output = out.getOutput();
            let testLine = output.split('\n')[0];
            expect(testLine).toMatch(/^not ok.*Expected the earth and the sky\./);
            expect(testLine).toMatch(/^not ok.*Expectations exceeded\./);
        });

        it('outputs messages and stack traces as diagnostic lines', function () {
            let diagnostics = out.getOutput().split('\n').slice(1);
            expect(diagnostics).toMatch(/^#.*Expected the earth and the sky\./m);
            expect(diagnostics).toMatch(/^#.*Expectations exceeded\./m);
            expect(diagnostics).toMatch(/^#.*line 1/m);
            expect(diagnostics).toMatch(/^#.*line 2/m);
            expect(diagnostics).toMatch(/^#.*line 3/m);
            expect(diagnostics).toMatch(/^#.*line 4/m);
            expect(diagnostics).toMatch(/^#.*line 5/m);
        });
    });

    describe('on failure with newlines', function () {
        beforeEach(function () {
            reporter.specStarted({});
            out.clear();
            reporter.specDone({
                fullName: 'foo',
                status: 'failed',
                failedExpectations: [{
                    message: 'A message\non two lines',
                    stack: '',
                }],
            });
        });

        it('prints no newlines on the test line', function () {
            let testLine = out.getOutput().split('\n')[0];
            expect(testLine).toMatch(/^not ok.*A message.*on two lines/);
        });

        it('prints no newlines in the diagnostics', function () {
            let diagnostics = out.getOutput().split('\n').slice(1);
            expect(diagnostics).not.toMatch(/^[^#]/);
        });
    });

    it('reports suites starting as diagnostic lines', function () {
        reporter.suiteStarted({
            fullName: 'A suite',
        });
        expect(out.getOutput()).toMatch(/^#.*A suite/);
    });

    it('reports suites finishing successfully as diagnostic lines', function () {
        reporter.suiteDone({
            status: 'passed',
            fullName: 'A suite',
            failedExpectations: [],
        });
        expect(out.getOutput()).toMatch(/^#.*A suite/);
    });

    it('reports suites with failing specs as diagnostic lines', function () {
        reporter.suiteDone({
            status: 'failed',
            fullName: 'A suite',
            failedExpectations: [],
        });
        expect(out.getOutput()).toMatch(/^#.*A suite/);
    });

    it('reports failures in afterAll as an extra failure', function () {
        reporter.suiteDone({
            status: 'failed',
            fullName: 'A suite',
            failedExpectations: [{message: 'An afterAll exception'}],
        });
        reporter.jasmineDone();
        expect(out.getOutput()).toMatch(/^not ok.*An afterAll exception/m);
    });
});
