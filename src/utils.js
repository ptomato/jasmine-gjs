/* exported ensureArray, indent */

// Make it legal to specify "some_option": "single_value" in the config file as
// well as "some_option": ["multiple", "values"]
function ensureArray(option) {
    if (!(option instanceof Array))
        return [option];
    return option;
}

function indent(str, spaces) {
    return str.split('\n').map((line) => {
        if (line === '')
            return line;
        return ' '.repeat(spaces) + line;
    }).join('\n');
}
