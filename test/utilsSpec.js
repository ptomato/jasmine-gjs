import {indenter} from '../src/utils.js';

describe('Indent', function () {
    it('prepends spaces to a string', function () {
        expect(indenter.indent('foo', 4)).toEqual('    foo');
    });

    it('prepends spaces to each line in a string', function () {
        expect(indenter.indent('a\nb\nc', 4)).toEqual('    a\n    b\n    c');
    });

    it('does not indent an extra blank line at the end of the string', function () {
        expect(indenter.indent('a\nb\n', 4)).toEqual('    a\n    b\n');
    });

    it('handles zero spaces', function () {
        expect(indenter.indent('foo', 0)).toEqual('foo');
        expect(indenter.indent('a\nb\nc', 0)).toEqual('a\nb\nc');
    });
});
