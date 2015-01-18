const Format = imports.format;
const Lang = imports.lang;
const System = imports.system;

String.prototype.format = Format.format;

const ARGS = {
    'help': {
        help: 'show this help',
        action: 'help',
    },
    'version': {
        help: 'print program version',
        action: 'store_true',
    },
    'no-color': {
        help: 'turn off color in spec output',
        dest: 'color',
        action: 'store_false',
        default: true,
    },
    'verbose': {
        help: 'print verbose results (similar to mocha)',
        action: 'store_true',
    }
};

function parseOptions(argv) {
    let namespace = {};
    let files = [];

    Object.keys(ARGS).forEach(function (arg_name) {
        let arg_info = ARGS[arg_name];
        let dest = arg_info.dest || arg_name;
        if (typeof arg_info.default !== 'undefined')
            namespace[dest] = arg_info.default;
    });

    let argv_element;
    while ((argv_element = argv.shift())) {
        if (!argv_element.startsWith('--')) {
            files.push(argv_element);
            continue;
        }

        let arg_name = argv_element.slice(2);
        if (!(arg_name in ARGS)) {
            printerr('warning: Unknown argument "%s"'.format(arg_name));
            continue;
        }

        let arg_info = ARGS[arg_name];
        let dest = arg_info.dest || arg_name;
        switch (arg_info.action) {
        case 'help':
            help();
            break;
        case 'store_true':
            namespace[dest] = true;
            break;
        case 'store_false':
            namespace[dest] = false;
            break;
        }
    }
    return [files, namespace];
}

function _lPad(str, length) {
    return ' '.repeat(length - str.length) + str;
}

function help() {
    print('Usage: jasmine [-I <include path>] [options] <files or directories>\n');
    print('If file given, runs the spec in that file. If directory given,');
    print('searches for and runs specs under that directory.\n');
    print('Options:');
    Object.keys(ARGS).forEach(function (arg_name) {
        print('%s\t\t%s'.format(_lPad('--' + arg_name, 15), ARGS[arg_name].help));
    });
    print('');
    System.exit(0);
}
