/**
 * Base class for selector strategies (Strategy Pattern)
 *
 * Each strategy knows how to convert a selector value into
 * a Playwright-compatible selector string.
 */
class SelectorStrategy {
  /**
   * Resolve selector value to Playwright-compatible selector
   * @param {string} selectorValue - The value to resolve
   * @returns {string} Playwright-compatible selector
   */
  resolve(selectorValue) {
    throw new Error('SelectorStrategy.resolve() must be implemented by subclass');
  }

  /**
   * Get the selector type for logging/debugging
   * @returns {string} Selector type name
   */
  getType() {
    throw new Error('SelectorStrategy.getType() must be implemented by subclass');
  }
}

export default SelectorStrategy;
