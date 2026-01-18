import AssertionStrategy from './AssertionStrategy.js';
import Logger from '../../utils/Logger.js';

/**
 * Assertion strategy for input/textarea value validation
 */
class InputValueAssertion extends AssertionStrategy {
  async execute(page, selector, expected, options = {}) {
    const timeout = options.timeout || 10000;
    const operator = options.operator || 'equals';

    // Wait for element
    await page.waitForSelector(selector, { timeout, state: 'visible' });

    // Get actual value
    const actualValue = await page.inputValue(selector);
    const actual = actualValue.trim();
    const expectedTrimmed = String(expected).trim();

    Logger.debug(`Input value assertion: "${actual}" ${operator} "${expectedTrimmed}"`);

    // Apply operator
    let passed = false;
    let message = '';

    switch (operator.toLowerCase()) {
      case 'equals':
      case 'equal':
      case '==':
        passed = actual === expectedTrimmed;
        message = passed
          ? `Input value matches: "${actual}"`
          : `Expected input value to be "${expectedTrimmed}", but got "${actual}"`;
        break;

      case 'contains':
      case 'includes':
        passed = actual.includes(expectedTrimmed);
        message = passed
          ? `Input value contains: "${expectedTrimmed}"`
          : `Expected input value to contain "${expectedTrimmed}", but got "${actual}"`;
        break;

      default:
        throw new Error(
          `Unsupported input value operator: "${operator}". ` + `Supported: equals, contains`
        );
    }

    return passed
      ? this.createSuccessResult(actual, expectedTrimmed, message)
      : this.createFailureResult(actual, expectedTrimmed, message);
  }

  getAssertionType() {
    return 'inputValue';
  }
}

export default InputValueAssertion;
