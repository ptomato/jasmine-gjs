/* exported indent */

function indent(str, spaces) {
    return str.split('\n').map((line) => {
        if (line === '')
            return line;
        return ' '.repeat(spaces) + line;
    }).join('\n');
}
