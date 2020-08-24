/* exported configToArgs, loadConfig, prepareLauncher, wrapArgs */

const {Gio, GLib} = imports.gi;

function _makePathsAbsolute(configFile, paths) {
    return paths.map(path => {
        if (GLib.path_is_absolute(path))
            return path;
        return configFile.get_parent().resolve_relative_path(path).get_path();
    });
}

// Make it legal to specify "some_option": "single_value" in the config file as
// well as "some_option": ["multiple", "values"]
function ensureArray(option) {
    if (!Array.isArray(option))
        return [option];
    return option;
}

function loadConfig(options, defaultFile = 'jasmine.json') {
    if (options['no-config'])
        return {};

    let config = {};
    const configFile = Gio.File.new_for_commandline_arg(options.config || defaultFile);

    try {
        let [, contents] = configFile.load_contents(null);
        if (contents instanceof Uint8Array)
            contents = imports.byteArray.toString(contents);
        config = JSON.parse(contents);
    } catch (e) {
        if (!options.config && e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND))
            return {};  // Don't complain if config file absent from default location
        throw new Error(`Configuration not read from ${configFile.get_path()}`);
    }

    if (config.include_paths) {
        config.include_paths = _makePathsAbsolute(configFile,
            ensureArray(config.include_paths));
    }
    if (config.spec_files) {
        config.spec_files = _makePathsAbsolute(configFile,
            ensureArray(config.spec_files));
    }

    const RECOGNIZED_KEYS = [
        'environment',
        'exclude',
        'include_paths',
        'interpreter',
        'options',
        'spec_files',
    ];
    Object.keys(config).forEach(key => {
        if (RECOGNIZED_KEYS.indexOf(key) === -1)
            printerr(`warning: unrecognized config file key "${key}"`);
    });

    print('Configuration loaded from', configFile.get_path());
    return config;
}

function optionsToArgs(options) {
    const args = [options.color ? '--color' : '--no-color'];
    if (options.verbose)
        args.push('--verbose');
    if (options.tap)
        args.push('--tap');
    if (options.junit) {
        args.push('--junit');
        args.push(options.junit);
    }
    if (options.exclude) {
        ensureArray(options.exclude).forEach(exclude => {
            args.push('--exclude');
            args.push(exclude);
        });
    }
    return args;
}

function configToArgs(config, specFiles = [], options = {}) {
    let retval = [];
    if (config.include_paths) {
        ensureArray(config.include_paths).forEach(path => {
            retval.push('-I');
            retval.push(path);
        });
    }
    if (config.exclude) {
        ensureArray(config.exclude).forEach(exclude => {
            retval.push('--exclude');
            retval.push(exclude);
        });
    }

    // Command-line options should always override config file options
    if (config.options)
        retval = retval.concat(ensureArray(config.options));
    retval = retval.concat(optionsToArgs(options), specFiles);
    // Specific tests given on the command line should always override the
    // default tests in the config file
    if (specFiles.length === 0 && config.spec_files)
        retval = retval.concat(ensureArray(config.spec_files));

    return retval;
}

function prepareLauncher(launcher, config) {
    if (config.environment) {
        Object.keys(config.environment).forEach(key => {
            if (config.environment[key] === null)
                launcher.unsetenv(key);
            else
                launcher.setenv(key, config.environment[key], true);
        });
    }
}

function wrapArgs(args, config, options = {}) {
    if (options.interpreter)
        args.unshift(...options.interpreter.split(' '));
    else if (config.interpreter)
        args.unshift(...config.interpreter.split(' '));
    return args;
}
