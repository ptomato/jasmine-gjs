/**
 *
 * Often a project will want to encapsulate custom matching code for use across multiple specs. Here is how to create a Jasmine-compatible custom matcher.
 *
 * A custom matcher at its root is a comparison function that takes an `actual` value and `expected` value. This factory is passed to Jasmine, ideally in a call to `beforeEach` and will be in scope and available for all of the specs inside a given call to `describe`. Custom matchers are torn down between specs. The name of the factory will be the name of the matcher exposed on the return value of the call to `expect`.
 *
 */

/**
 * This object has a custom matcher named "toBeGoofy".
 */
var customMatchers = {

  /**
   * ## Matcher Factories
   *
   * Custom matcher factories are passed a `matchersUtil` parameter, which has a set
   * of utility functions for matchers to use to perform tasks like determining
   * whether two objects are equal
   * (see: [`MatchersUtil`][MatchersUtil] for reference documentation). By using
   * `MatchersUtil` where appropriate, custom matchers can work with
   * [custom equality testers][CustomEqualityTesters] and
   * [custom object formatters][CustomObjectFormatters] without any extra effort.
   *
   * A second `customEqualityTesters` parameter is passed for compatibility with
   * Jasmine 3.5 and earlier. Matchers written for Jasmine 3.6 and later should
   * ignore it. It will no longer be provided in Jasmine 4.
   *
   * [MatchersUtil]: /api/edge/MatchersUtil.html
   * [CustomEqualityTesters]: /tutorials/custom_equality
   * [CustomObjectFormatters]: /tutorials/custom_object_formatters
   */
  toBeGoofy: function(matchersUtil) {
    /**
     * The factory method should return an object with a `compare` function that will be called to check the expectation.
     */
    return {
      /**
       * ## A Function to `compare`
       *
       * The compare function receives the value passed to `expect()` as the first argument - the actual - and the value (if any) passed to the matcher itself as second argument.
       */
      compare: function(actual, expected) {

        /**
         * `toBeGoofy` takes an optional `expected` argument, so define it here if not passed in.
         */
        if (expected === undefined) {
          expected = '';
        }

        /**
         * ### Result
         *
         * The `compare` function must return a result object with a `pass` property that is a boolean result of the matcher. The `pass` property tells the expectation whether the matcher was successful (`true`) or unsuccessful (`false`). If the expectation is called/chained with `.not`, the expectation will negate this to determine whether the expectation is met.
         */
        var result = {};

        /**
         * `toBeGoofy` tests for equality of the actual's `hyuk` property to see if it matches the expectation.
         */
        result.pass = matchersUtil.equals(actual.hyuk, "gawrsh" + expected);

        /**
         * ### Failure Messages
         *
         * If left `undefined`, the expectation will attempt to craft a failure message for the matcher. However, if the return value has a `message` property it will be used for a  failed expectation.
         */
        if (result.pass) {
          /**
           * The matcher succeeded, so the custom failure message should be present in the case of a negative expectation - when the expectation is used with `.not`.
           */
          result.message = "Expected " + actual + " not to be quite so goofy";
        } else {
          /**
           * The matcher failed, so the custom failure message should be present in the case of a positive expectation
           */
          result.message = "Expected " + actual + " to be goofy, but it was not very goofy";
        }

        /**
         * Return the result of the comparison.
         */
        return result;
      }
    };
  }
};

/**
* ### Custom negative comparators
*
* If you need more control over the negative comparison (the `not` case) than the simple boolean inversion above, you can also have your matcher factory include another key, `negativeCompare` alongside `compare`, for which the value is a function to invoke when `.not` is used. This function/key is optional.
*/

/**
 * ## Registration and Usage
 */
describe("Custom matcher: 'toBeGoofy'", function() {
  /**
   * Register the custom matchers with Jasmine. All properties on the object passed in will be available as custom matchers (e.g., in this case `toBeGoofy`).
   */
  beforeEach(function() {
    jasmine.addMatchers(customMatchers);
  });

  /**
   * Once a custom matcher is registered with Jasmine, it is available on any expectation.
   */
  it("is available on an expectation", function() {
    expect({
      hyuk: 'gawrsh'
    }).toBeGoofy();
  });

  it("can take an 'expected' parameter", function() {
    expect({
      hyuk: 'gawrsh is fun'
    }).toBeGoofy(' is fun');
  });

  it("can be negated", function() {
    expect({
      hyuk: 'this is fun'
    }).not.toBeGoofy();
  });
});