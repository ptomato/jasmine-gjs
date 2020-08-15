/* global jasmineImporter */

const Timer = jasmineImporter.timer;

describe('The default timer', function () {
    it('stops timing when elapsed() is called', function () {
        const timer = Timer.createDefaultTimer();
        timer.start();
        expect(timer.elapsed()).toEqual(timer.elapsed());
    });
});
