import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

function _makePathsAbsolute(configFile, paths) {
    return paths.map(path => {
        if (GLib.path_is_absolute(path))
            return path;
        return configFile.get_parent().resolve_relative_path(path).get_path();
    });
}

// Make it legal to specify "some_option": "single_value" in the config file as
// well as "some_option": ["multiple", "values"]
export function ensureArray(option) {
    if (!Array.isArray(option))
        return [option];
    return option;
}

export function loadConfig(options, defaultFile = 'jasmine.json') {
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
    if (options.module)
        args.push('--module');
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

export function configToArgs(config, specFiles = [], options = {}) {
    let retval = [];
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

export function prepareLauncher(config, options = {}) {
    let flags = Gio.SubprocessFlags.NONE;
    if (options.debug)
        flags |= Gio.SubprocessFlags.STDIN_INHERIT;
    const launcher = new Gio.SubprocessLauncher({flags});
    if (config.environment) {
        Object.keys(config.environment).forEach(key => {
            if (config.environment[key] === null)
                launcher.unsetenv(key);
            else
                launcher.setenv(key, config.environment[key], true);
        });
    }
    if (config.include_paths) {
        const existingPaths = launcher.getenv('GJS_PATH');
        const paths = ensureArray(config.include_paths).slice();
        if (existingPaths)
            paths.unshift(existingPaths);
        launcher.setenv('GJS_PATH', paths.join(':'), /* overwrite = */ true);
    }
    return launcher;
}

export function wrapArgs(args, config, options = {}) {
    if (options.interpreter)
        args.unshift(...options.interpreter.split(' '));
    else if (config.interpreter)
        args.unshift(...config.interpreter.split(' '));
    else if (options.module)
        args.push('--module');
    if (options.debug) {
        if (!options.interpreter && !config.interpreter)
            args.unshift('gjs', '-m');
        args.unshift(...options.debug.split(' '));
    }
    return args;
}
