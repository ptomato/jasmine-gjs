const Timer = imports.timer;

describe('The default timer', function () {
    it('stops timing when elapsed() is called', function () {
        let timer = Timer.createDefaultTimer();
        timer.start();
        expect(timer.elapsed()).toEqual(timer.elapsed());
    });
});
