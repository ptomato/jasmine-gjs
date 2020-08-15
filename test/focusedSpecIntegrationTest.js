// This is a test of focused suites and specs with the fdescribe() and fit()
// functions. It's taken from Jasmine's documentation suite:
//   http://jasmine.github.io/2.2/focused_specs.html

// By definition, this suite will disable all other suites that are run during
// the same invocation of Jasmine -- so it is skipped by default. To run this
// test anyway, run it explicitly with "jasmine
// test/focusedSpecIntegrationTest.js". During "make check" it is still run,
// since make runs the spec files one by one and so this suite won't interfere
// with any other suites.

describe('Focused specs', function () {
    fit('is focused and will run', function () {
        expect(true).toBeTruthy();
    });

    it('is not focused and will not run', function () {
        expect(true).toBeFalsy();
    });

    fdescribe('focused describe', function () {
        it('will run', function () {
            expect(true).toBeTruthy();
        });

        it('will also run', function () {
            expect(true).toBeTruthy();
        });
    });

    fdescribe('another focused describe', function () {
        fit('is focused and will run', function () {
            expect(true).toBeTruthy();
        });

        it('is not focused and will not run', function () {
            expect(true).toBeFalsy();
        });
    });
});
