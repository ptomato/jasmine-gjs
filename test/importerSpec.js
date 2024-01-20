const Utils = imports.utils;

describe('Jasmine importer', function () {
    it('hides Jasmine modules from the test code', function () {
        expect(Object.keys(Utils)).not.toContain('indenter');
    });

    it("lets test code import modules named the same as Jasmine's", function () {
        expect(Utils.add).toBeDefined();
    });
});
