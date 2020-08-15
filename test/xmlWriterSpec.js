/* global jasmineImporter */

const XMLWriter = jasmineImporter.xmlWriter;

describe('XML writer', function () {
    let node;

    beforeEach(function () {
        node = new XMLWriter.Node('node');
    });

    it('prints a doctype declaration', function () {
        expect(node.toString()).toMatch(/^<\?xml version=(['"])1\.0\1 encoding=(['"])UTF-8\2\?>/);
    });

    it('prints a single empty node', function () {
        expect(node.toString()).toMatch('<node/>');
    });

    it('prints a single node with an attribute', function () {
        node.attrs = {
            attr: 'value',
        };
        expect(node.toString()).toMatch(/<node attr=(['"])value\1\/>/);
    });

    it('separates attributes with a space', function () {
        node.attrs = {
            attr: 'value',
            key: 'something',
        };
        expect(node.toString()).toMatch(/<node attr=(['"])value\1 key=(['"])something\2\/>/);
    });

    it('escapes attribute values', function () {
        node.attrs = {
            attr: '"<>&\'',
        };
        expect(node.toString()).toMatch(/<node attr=(['"])&quot;&lt;&gt;&amp;&apos;\1\/>/);
    });

    it('prints child nodes', function () {
        node.children.push(new XMLWriter.Node('child'));
        expect(node.toString()).toMatch(/<node>\s*<child\/>\s*<\/node>/);
    });

    it('prints child nodes in order', function () {
        node.children = [
            new XMLWriter.Node('child-one'),
            new XMLWriter.Node('child-two'),
            new XMLWriter.Node('child-three'),
        ];
        expect(node.toString()).toMatch(/<node>\s*<child-one\/>\s*<child-two\/>\s*<child-three\/>\s*<\/node>/);
    });

    it('prints child nodes indented', function () {
        node.children.push(new XMLWriter.Node('child'));
        expect(node.toString()).toMatch('<node>\n  <child/>\n</node>\n');
    });

    it('prints multiple levels of indentation', function () {
        const child = new XMLWriter.Node('child');
        child.children.push(new XMLWriter.Node('descendant'));
        node.children.push(child);
        const output = node.toString();
        expect(output).toMatch('\n<node>\n');
        expect(output).toMatch('\n  <child>\n');
        expect(output).toMatch('\n    <descendant/>\n');
        expect(output).toMatch('\n  </child>\n');
        expect(output).toMatch('\n</node>\n');
    });

    it('prints text content', function () {
        node.text = 'A very fine day';
        expect(node.toString()).toMatch(/<node>\s*A very fine day\s*<\/node>/);
    });

    it('prints text content indented', function () {
        node.text = 'A very fine day';
        expect(node.toString()).toMatch('\n  A very fine day\n');
    });

    it('trims text content', function () {
        node.text = '     \nA very fine day\n     ';
        expect(node.toString()).toMatch('<node>\n  A very fine day\n</node>');
    });

    it('escapes text content', function () {
        node.text = '"<>&\'';
        expect(node.toString()).toMatch('&quot;&lt;&gt;&amp;&apos;');
    });

    it('prints child nodes and text content', function () {
        node.children.push(new XMLWriter.Node('child'));
        node.text = 'Other content';
        const output = node.toString();
        expect(output).toMatch('<child/>');
        expect(output).toMatch('Other content');
    });
});
