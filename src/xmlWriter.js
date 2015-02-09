const GLib = imports.gi.GLib;

const Utils = imports.utils;

function Node(name) {
    this.name = name;
    this.attrs = {};
    this.children = [];
    this.text = '';
}

function _attrsToString(attrs) {
    return Object.keys(attrs).map((key) => {
        let value = attrs[key].toString();
        return ' ' + key + '="' + GLib.markup_escape_text(value, -1) + '"';
    }).join('');
}

function _prettyprint(node) {
    if (node.children.length === 0 && node.text.length === 0)
        return '<' + node.name + _attrsToString(node.attrs) + '/>\n';

    let elementTop = '<' + node.name + _attrsToString(node.attrs) + '>\n';
    let elementBottom = '</' + node.name + '>\n';
    let children = node.children.map(_prettyprint).join('');
    let text = GLib.markup_escape_text(node.text, -1).trim();
    if (text.length !== 0)
        text += '\n';

    return elementTop + Utils.indent(children, 2) + Utils.indent(text, 2) +
        elementBottom;
}

Node.prototype.toString = function () {
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + _prettyprint(this);
};
