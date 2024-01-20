import GLib from 'gi://GLib';

// Measures elapsed time in milliseconds.
export function createDefaultTimer() {
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
