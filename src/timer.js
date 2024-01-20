/* exported installAPI, createDefaultTimer */

const {GLib} = imports.gi;
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
// globalThis to get these available globally.)
function installAPI(global) {
    global.setTimeout = _setTimeoutInternal.bind(undefined, GLib.SOURCE_REMOVE);
    global.setInterval = _setTimeoutInternal.bind(undefined, GLib.SOURCE_CONTINUE);
    global.clearTimeout = global.clearInterval = _clearTimeoutInternal;
}

// Measures elapsed time in milliseconds.
function createDefaultTimer() {
    let startTime, elapsedTime;
    return {
        start() {
            startTime = GLib.get_monotonic_time();
        },
        elapsed() {
            if (!elapsedTime)
                elapsedTime = (GLib.get_monotonic_time() - startTime) / 1000;
            return elapsedTime;
        },
    };
}
