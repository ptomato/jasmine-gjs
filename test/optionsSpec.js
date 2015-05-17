/* global jasmineImporter */

// FIXME: the argument parser should be refactored into something more general
// so that the ARGS object in options.js isn't hardcoded.

const Options = jasmineImporter.options;

describe('Argument parser', function () {
    it('stores the given value for a "store" argument', function () {
        let [files, namespace] = Options.parseOptions(['--junit', 'file.txt']);
        expect(files).toEqual([]);
        expect(namespace['junit']).toEqual('file.txt');
    });

    it('stores the value from "const" for a "store" argument if none given', function () {
        let [files, namespace] = Options.parseOptions(['--junit']);
        expect(files).toEqual([]);
        expect(namespace['junit']).toEqual('report.xml');
    });

    it('stores values in the order they are given on the command line', function () {
        let [files, namespace] = Options.parseOptions(['--no-color', '--color']);
        expect(namespace['color']).toBe(true);
    });

    it('stores the given value for an "append" argument', function () {
        let [files, namespace] = Options.parseOptions(['--exclude', 'file.js']);
        expect(namespace['exclude']).toEqual(['file.js']);
    });

    it('stores multiple values for an "append" argument appearing multiple times', function () {
        let [files, namespace] = Options.parseOptions([
            '--exclude', 'file.js',
            '--exclude', 'file2.js',
        ]);
        expect(namespace['exclude']).toEqual(['file.js', 'file2.js']);
    });
});
