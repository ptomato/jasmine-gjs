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
    'color': {
        help: 'turn on color in spec output',
        action: 'store_true',
    },
    'verbose': {
        help: 'print verbose results (similar to mocha)',
        action: 'store_true',
    },
    'tap': {
        help: 'output results in TAP format',
        action: 'store_true',
    },
    'junit': {
        help: 'output a JUnit report to the given file [report.xml]',
        action: 'store',
        nargs: '?',
        const: 'report.xml',
    },
    'config': {
        help: 'load configuration from the given file',
        action: 'store',
    },
    'no-config': {
        help: 'ignore the default jasmine.json config file',
        action: 'store_true',
    },
    'exclude': {
        help: 'do not execute the given spec (may include wildcards)',
        action: 'append',
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
        let value;
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
        case 'store':
            value = _getNextArgument(argv);
            if (typeof value === 'undefined' && arg_info.nargs === '?')
                value = arg_info.const;
            if (typeof value === 'undefined') {
                printerr('warning: Missing value for argument "%s"'.format(arg_name));
                continue;
            }
            namespace[dest] = value;
            break;
        case 'append':
            value = _getNextArgument(argv);
            if (typeof value === 'undefined') {
                printerr('warning: Missing value for argument "%s"'.format(arg_name));
                continue;
            }
            if (!(dest in namespace))
                namespace[dest] = [];
            namespace[dest].push(value);
            break;
        }
    }
    return [files, namespace];
}

function _lPad(str, length) {
    return ' '.repeat(length - str.length) + str;
}

function _getNextArgument(argv) {
    let value = argv.shift();
    if (typeof value !== 'undefined' && value.startsWith('--')) {
        argv.unshift(value);
        value = undefined;
    }
    return value;
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
