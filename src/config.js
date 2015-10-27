/* global jasmineImporter */
/* exported configToArgs, loadConfig */

const Format = imports.format;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

String.prototype.format = Format.format;

const Utils = jasmineImporter.utils;

function _makePathsAbsolute(configFile, paths) {
    return paths.map((path) => {
        if (GLib.path_is_absolute(path))
            return path;
        return configFile.get_parent().resolve_relative_path(path).get_path();
    });
}

function loadConfig(options, defaultFile='jasmine.json') {
    if (options['no-config'])
        return {};

    let config = {};
    let configFile = Gio.File.new_for_commandline_arg(options.config || defaultFile);

    try {
        let [, contents] = configFile.load_contents(null);
        if (contents instanceof Uint8Array) {
            contents = imports.byteArray.toString(contents)
        }
        config = JSON.parse(contents);
    } catch (e) {
        if (!options.config && e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND))
            return {};  // Don't complain if config file absent from default location
        throw new Error('Configuration not read from ' + configFile.get_path());
    }

    if (config.include_paths)
        config.include_paths = _makePathsAbsolute(configFile,
            Utils.ensureArray(config.include_paths));
    if (config.spec_files)
        config.spec_files = _makePathsAbsolute(configFile,
            Utils.ensureArray(config.spec_files));

    const RECOGNIZED_KEYS = [
        'environment',
        'exclude',
        'include_paths',
        'options',
        'spec_files',
    ];
    Object.keys(config).forEach((key) => {
        if (RECOGNIZED_KEYS.indexOf(key) === -1)
            printerr('warning: unrecognized config file key "%s"'.format(key));
    });

    print('Configuration loaded from', configFile.get_path());
    return config;
}

function configToArgs(config, shouldAddSpecFiles=false) {
    let retval = [];
    if (config.include_paths) {
        Utils.ensureArray(config.include_paths).forEach((path) => {
            retval.push('-I');
            retval.push(path);
        });
    }
    if (config.exclude) {
        Utils.ensureArray(config.exclude).forEach((exclude) => {
            retval.push('--exclude');
            retval.push(exclude);
        });
    }
    if (config.options)
        retval = retval.concat(Utils.ensureArray(config.options));
    if (shouldAddSpecFiles && config.spec_files)
        retval = retval.concat(Utils.ensureArray(config.spec_files));
    return retval;
}
