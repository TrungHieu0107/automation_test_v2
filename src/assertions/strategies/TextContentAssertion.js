import AssertionStrategy from './AssertionStrategy.js';
import Logger from '../../utils/Logger.js';

/**
 * Assertion strategy for text content validation
 * Supports operators: equals, contains, regex
 */
class TextContentAssertion extends AssertionStrategy {
  async execute(page, selector, expected, options = {}) {
    const timeout = options.timeout || 10000;
    const operator = options.operator || 'equals';

    // Wait for element
    await page.waitForSelector(selector, { timeout, state: 'visible' });

    // Get actual text content
    const element = await page.$(selector);
    const actualText = await element.textContent();
    const actual = actualText.trim();
    const expectedTrimmed = String(expected).trim();

    Logger.debug(`Text assertion: "${actual}" ${operator} "${expectedTrimmed}"`);

    // Apply operator
    let passed = false;
    let message = '';

    switch (operator.toLowerCase()) {
      case 'equals':
      case 'equal':
      case '==':
        passed = actual === expectedTrimmed;
        message = passed
          ? `Text matches: "${actual}"`
          : `Expected text to equal "${expectedTrimmed}", but got "${actual}"`;
        break;

      case 'contains':
      case 'includes':
        passed = actual.includes(expectedTrimmed);
        message = passed
          ? `Text contains: "${expectedTrimmed}"`
          : `Expected text to contain "${expectedTrimmed}", but got "${actual}"`;
        break;

      case 'regex':
      case 'regexp':
      case 'matches':
        const regex = new RegExp(expectedTrimmed);
        passed = regex.test(actual);
        message = passed
          ? `Text matches regex: ${expectedTrimmed}`
          : `Expected text to match regex /${expectedTrimmed}/, but got "${actual}"`;
        break;

      default:
        throw new Error(
          `Unsupported text assertion operator: "${operator}". ` +
            `Supported: equals, contains, regex`
        );
    }

    return passed
      ? this.createSuccessResult(actual, expectedTrimmed, message)
      : this.createFailureResult(actual, expectedTrimmed, message);
  }

  getAssertionType() {
    return 'textContent';
  }
}

export default TextContentAssertion;
