import Logger from '../../utils/Logger.js';

/**
 * Base class for assertion strategies (Strategy Pattern)
 * 
 * Each strategy knows how to validate a specific assertion type
 * Single Responsibility: Define interface for assertion execution
 */
class AssertionStrategy {
  /**
   * Execute the assertion
   * 
   * @param {Page} page - Playwright page object
   * @param {string} selector - Resolved Playwright selector
   * @param {any} expected - Expected value
   * @param {object} options - Additional options (operator, timeout, etc.)
   * @returns {Promise<object>} Assertion result { passed, actual, expected, message }
   */
  async execute(page, selector, expected, options = {}) {
    throw new Error('AssertionStrategy.execute() must be implemented by subclass');
  }

  /**
   * Get the assertion type name
   * @returns {string} Assertion type identifier
   */
  getAssertionType() {
    throw new Error('AssertionStrategy.getAssertionType() must be implemented by subclass');
  }

  /**
   * Create success result
   * @param {any} actual - Actual value
   * @param {any} expected - Expected value
   * @param {string} message - Optional success message
   */
  createSuccessResult(actual, expected, message = '') {
    return {
      passed: true,
      actual,
      expected,
      message: message || `Assertion passed: ${actual} === ${expected}`
    };
  }

  /**
   * Create failure result
   * @param {any} actual - Actual value
   * @param {any} expected - Expected value
   * @param {string} message - Failure message
   */
  createFailureResult(actual, expected, message) {
    return {
      passed: false,
      actual,
      expected,
      message
    };
  }
}

export default AssertionStrategy;
