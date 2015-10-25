/* global jasmineImporter */

const Utils = jasmineImporter.utils;

describe('Indent', function () {
    it('prepends spaces to a string', function () {
        expect(Utils.indent('foo', 4)).toEqual('    foo');
    });

    it('prepends spaces to each line in a string', function () {
        expect(Utils.indent('a\nb\nc', 4)).toEqual('    a\n    b\n    c');
    });

    it('does not indent an extra blank line at the end of the string', function () {
        expect(Utils.indent('a\nb\n', 4)).toEqual('    a\n    b\n');
    });

    it('handles zero spaces', function () {
        expect(Utils.indent('foo', 0)).toEqual('foo');
        expect(Utils.indent('a\nb\nc', 0)).toEqual('a\nb\nc');
    });
});

describe('Ensure array', function () {
    it('does not change an array', function () {
        expect(Utils.ensureArray(['a', 'b'])).toEqual(['a', 'b']);
    });

    it('puts a single value into an array', function () {
        expect(Utils.ensureArray('a')).toEqual(['a']);
    });
});
