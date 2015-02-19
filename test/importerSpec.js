const Utils = imports.utils;

describe('Jasmine importer', function () {
    it('hides Jasmine modules from the test code', function () {
        expect(Utils.indent).not.toBeDefined();
    });

    it("lets test code import modules named the same as Jasmine's", function () {
        expect(Utils.add).toBeDefined();
    });
});
