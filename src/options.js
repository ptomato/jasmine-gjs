/* exported parseOptions */

const System = imports.system;

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
    },
    'interpreter': {
        help: 'run with the given program instead of /usr/bin/env gjs',
        action: 'store',
    },
    'debug': {
        help: 'run with a debugger [gdb --args]',
        action: 'store',
        nargs: '?',
        const: 'gdb --args',
    },
};

function parseOptions(argv) {
    argv = argv.slice();  // Make a copy
    const namespace = {};
    const files = [];

    Object.keys(ARGS).forEach(function (argName) {
        const argInfo = ARGS[argName];
        const dest = argInfo.dest || argName;
        if (typeof argInfo.default !== 'undefined')
            namespace[dest] = argInfo.default;
    });

    let argvElement;
    while ((argvElement = argv.shift())) {
        if (!argvElement.startsWith('-')) {
            files.push(argvElement);
            continue;
        }

        if (!argvElement.startsWith('--')) {
            printerr(`warning: Unknown argument "${argvElement}"`);
            continue;
        }
        const argName = argvElement.slice(2);
        if (!(argName in ARGS)) {
            printerr(`warning: Unknown argument "${argvElement}"`);
            continue;
        }

        const argInfo = ARGS[argName];
        const dest = argInfo.dest || argName;
        let value;
        switch (argInfo.action) {
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
            if (typeof value === 'undefined' && argInfo.nargs === '?')
                value = argInfo.const;
            if (typeof value === 'undefined') {
                printerr(`warning: Missing value for argument "${argName}"`);
                continue;
            }
            namespace[dest] = value;
            break;
        case 'append':
            value = _getNextArgument(argv);
            if (typeof value === 'undefined') {
                printerr(`warning: Missing value for argument "${argName}"`);
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
    Object.keys(ARGS).forEach(function (argName) {
        print(`${`--${argName}`.padStart(15)}\t\t${ARGS[argName].help}`);
    });
    print('');
    System.exit(0);
}
