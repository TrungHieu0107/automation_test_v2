import AssertionStrategy from './AssertionStrategy.js';
import Logger from '../../utils/Logger.js';

/**
 * Assertion strategy for CSS style properties
 * Validates computed styles (color, display, font-size, etc.)
 */
class StyleAssertion extends AssertionStrategy {
  async execute(page, selector, expected, options = {}) {
    const timeout = options.timeout || 10000;
    const property = options.property;

    if (!property) {
      throw new Error(
        'Style assertion requires "property" option. ' +
          'Example: { type: "style", property: "color", expected: "rgb(0, 0, 0)" }'
      );
    }

    Logger.debug(`Style assertion: ${property} should be "${expected}"`);

    try {
      // Wait for element
      await page.waitForSelector(selector, { timeout, state: 'visible' });

      // Get computed style property
      const actualValue = await page.$eval(
        selector,
        (el, prop) => getComputedStyle(el)[prop],
        property
      );

      const actual = actualValue.trim();
      const expectedValue = String(expected).trim();

      // Compare values
      const passed = actual === expectedValue;

      if (passed) {
        return this.createSuccessResult(
          actual,
          expectedValue,
          `Style property "${property}" matches: "${actual}"`
        );
      } else {
        return this.createFailureResult(
          actual,
          expectedValue,
          `Expected style property "${property}" to be "${expectedValue}", but got "${actual}"`
        );
      }
    } catch (error) {
      return this.createFailureResult(
        'unknown',
        expected,
        `Style assertion failed: ${error.message}`
      );
    }
  }

  getAssertionType() {
    return 'style';
  }
}

export default StyleAssertion;
