/* global jasmineImporter */
/* exported Jasmine */

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

GObject.ParamFlags.READWRITE = GObject.ParamFlags.READABLE | GObject.ParamFlags.WRITABLE;

var Jasmine = new Lang.Class({
    Name: 'Jasmine',
    Extends: GObject.Object,

    Properties: {
        'version': GObject.ParamSpec.string('version', 'Version',
            'Version of Jasmine library',
            GObject.ParamFlags.READABLE,
            ''),
    },

    _init: function (props={}) {
        let jasmineCore;
        if (props.hasOwnProperty('jasmineCore')) {
            jasmineCore = props.jasmineCore;
            delete props.jasmineCore;
        } else {
            jasmineCore = jasmineImporter.jasmine;
        }

        this.parent(props);

        let jasmineCorePath = jasmineCore.__file__;
        this._jasmineCoreFile = Gio.File.new_for_path(jasmineCorePath);

        let jasmineRequire = jasmineCore.getJasmineRequireObj();
        this._jasmine = jasmineRequire.core(jasmineRequire);
        this.env = this._jasmine.getEnv();
        this._jasmineInterface = jasmineRequire.interface(this._jasmine, this.env);

        this.exclusions = [];
        this.specFiles = [];
        this._reportersCount = 0;
    },

    get version() {
        return this._jasmine.version;
    },

    addReporter: function (reporter) {
        reporter.jasmine_core_path = this._jasmineCoreFile.get_parent().get_path();
        this.env.addReporter(reporter);
        this._reportersCount++;
    },

    _addSpecFile: function (file) {
        let absolutePath = file.get_path();
        let shouldSkip = this.exclusions.some((pattern) => {
            // Match globs against the absolute path
            if (GLib.pattern_match_simple(pattern, absolutePath))
                return true;
            // Also match if the string matches at the end
            if (GLib.pattern_match_simple('*/' + pattern, absolutePath))
                return true;
            // Also match if the string matches the path at the end
            return GLib.pattern_match_simple('*/' + pattern,
                file.get_parent().get_path());
        });
        if (shouldSkip)
            return;
        if (this.specFiles.indexOf(absolutePath) === -1)
            this.specFiles.push(absolutePath);
    },

    addSpecFiles: function (filePaths) {
        filePaths.forEach((filePath) => {
            let file = Gio.File.new_for_path(filePath);
            let type = file.query_file_type(Gio.FileQueryInfoFlags.NONE, null);

            switch (type) {
            case Gio.FileType.REGULAR:
                this._addSpecFile(file);
                break;
            case Gio.FileType.DIRECTORY:
                recurseDirectory(file, this._addSpecFile.bind(this));
                break;
            default:
                // ignore
            }
        });
    },

    loadSpecs: function () {
        let oldSearchPath = imports.searchPath.slice();  // make a copy
        this.specFiles.forEach(function (file) {
            let modulePath = GLib.path_get_dirname(file);
            let moduleName = GLib.path_get_basename(file).slice(0, -3);  // .js
            imports.searchPath.unshift(modulePath);
            void imports[moduleName];
            imports.searchPath = oldSearchPath;
        });
    },

    execute: function (files) {
        if (files && files.length > 0)
            this.addSpecFiles(files);

        this.loadSpecs();
        this.env.execute();
    },

    // Install Jasmine API on the global object
    installAPI: function (global) {
        Lang.copyProperties(this._jasmineInterface, global);
    },
});

function recurseDirectory(directory, func) {
    let enumerator = directory.enumerate_children('standard::*',
        Gio.FileQueryInfoFlags.NONE, null);

    let info;
    while ((info = enumerator.next_file(null))) {
        // COMPAT: use the following on GLib >= 2.36:
        // let file = enumerator.get_child(info);
        // let filename = file.get_basename();
        let filename = info.get_name();
        let file = enumerator.get_container().get_child(filename);

        if (info.get_file_type() === Gio.FileType.DIRECTORY) {
            recurseDirectory(file, func);
        } else {
            if (filename.endsWith('.js'))
                func(file);
        }
    }
}
