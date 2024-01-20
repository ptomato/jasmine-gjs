/* global jasmineImporter */
/* exported Jasmine */

const {Gio, GLib} = imports.gi;

var Jasmine = class Jasmine {
    constructor({jasmineCore} = {jasmineCore: jasmineImporter.jasmine}) {
        const jasmineCorePath = jasmineCore.__file__;
        this._jasmineCoreFile = Gio.File.new_for_path(jasmineCorePath);

        const jasmineRequire = jasmineCore.getJasmineRequireObj();
        this._jasmine = jasmineRequire.core(jasmineRequire);
        this.env = this._jasmine.getEnv();
        this.env.configure({
            random: false,
        });
        this._jasmineInterface = jasmineRequire.interface(this._jasmine, this.env);

        this.exclusions = [];
        this.specFiles = [];
        this._reportersCount = 0;
    }

    get version() {
        return this._jasmine.version;
    }

    addReporter(reporter) {
        reporter.jasmine_core_path = this._jasmineCoreFile.get_parent().get_path();
        this.env.addReporter(reporter);
        this._reportersCount++;
    }

    _addSpecFile(file) {
        const absolutePath = file.get_path();
        const shouldSkip = this.exclusions.some(pattern => {
            // Match globs against the absolute path
            if (GLib.pattern_match_simple(pattern, absolutePath))
                return true;
            // Also match if the string matches at the end
            if (GLib.pattern_match_simple(`*/${pattern}`, absolutePath))
                return true;
            // Also match if the string matches the path at the end
            return GLib.pattern_match_simple(`*/${pattern}`,
                file.get_parent().get_path());
        });
        if (shouldSkip)
            return;
        if (this.specFiles.indexOf(absolutePath) === -1)
            this.specFiles.push(absolutePath);
    }

    addSpecFiles(filePaths) {
        filePaths.forEach(filePath => {
            const file = Gio.File.new_for_path(filePath);
            const type = file.query_file_type(Gio.FileQueryInfoFlags.NONE, null);

            switch (type) {
            case Gio.FileType.REGULAR:
            case Gio.FileType.UNKNOWN:
                this._addSpecFile(file);
                break;
            case Gio.FileType.DIRECTORY:
                recurseDirectory(file, this._addSpecFile.bind(this));
                break;
            default:
                // ignore
            }
        });
    }

    loadSpecs() {
        const oldSearchPath = imports.searchPath.slice();  // make a copy
        let specImporter = imports['.'];
        this.specFiles.forEach(function (file) {
            const modulePath = GLib.path_get_dirname(file);
            const moduleName = GLib.path_get_basename(file).slice(0, -3);  // .js

            // Backwards compatibility - let specs import modules from their own
            // directories
            imports.searchPath.unshift(modulePath);
            specImporter.searchPath.unshift(modulePath);
            try {
                void specImporter[moduleName];
            } catch (err) {
                if (!(err instanceof SyntaxError || err.name === 'ImportError'))
                    throw err;
                // Fake failing suite, to log a failure but continue on with
                // other specs
                window.describe(file, function () {
                    window.it('did not import correctly', function () {
                        let failureMessage;
                        if (err instanceof SyntaxError) {
                            const {fileName, lineNumber, columnNumber, message} = err;
                            failureMessage = `${fileName}:${lineNumber}:${columnNumber}: ${message}`;
                        } else {
                            failureMessage = err.message;
                        }
                        window.fail(failureMessage);
                    });
                });
            }
            imports.searchPath = oldSearchPath;

            // Make a new copy of the importer in case we need to import another
            // spec with the same filename, so it is not cached
            specImporter = specImporter['.'];
        });
    }

    execute(files) {
        if (files && files.length > 0)
            this.addSpecFiles(files);

        this.loadSpecs();
        this.env.execute();
    }

    // Install Jasmine API on the global object
    installAPI(global) {
        Object.assign(global, this._jasmineInterface);
    }
};

function recurseDirectory(directory, func) {
    const enumerator = directory.enumerate_children('standard::*',
        Gio.FileQueryInfoFlags.NONE, null);

    let info;
    while ((info = enumerator.next_file(null))) {
        const file = enumerator.get_child(info);
        const filename = file.get_basename();

        if (info.get_file_type() === Gio.FileType.DIRECTORY)
            recurseDirectory(file, func);
        else if (filename.endsWith('.js'))
            func(file);
    }
}
