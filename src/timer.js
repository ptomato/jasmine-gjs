const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;

function _setTimeoutInternal(continueTimeout, func, time) {
    return Mainloop.timeout_add(time, function () {
        func();
        return continueTimeout;
    });
}

function _clearTimeoutInternal(id) {
    if (id > 0)
        Mainloop.source_remove(id);
}

// Installs the browser setTimeout/setInterval API on the given object. (Pass
// window to get these available globally.)
function installAPI(global) {
    global.setTimeout = _setTimeoutInternal.bind(undefined, GLib.SOURCE_REMOVE);
    global.setInterval = _setTimeoutInternal.bind(undefined, GLib.SOURCE_CONTINUE);
    global.clearTimeout = global.clearInterval = _clearTimeoutInternal;
}

// Measures elapsed time in milliseconds.
function createDefaultTimer() {
    let startTime;
    return {
        start: function () {
            startTime = GLib.get_monotonic_time();
        },
        elapsed: function () {
            let endTime = GLib.get_monotonic_time();
            return (endTime - startTime) / 1000;
        },
    };
}
