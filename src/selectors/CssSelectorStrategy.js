import SelectorStrategy from './SelectorStrategy.js';

/**
 * Resolves CSS selectors (passthrough)
 * Allows any valid CSS selector to be used directly
 */
class CssSelectorStrategy extends SelectorStrategy {
  /**
   * Pass through CSS selector as-is
   * @param {string} selectorValue - Any valid CSS selector
   * @returns {string} The same CSS selector
   */
  resolve(selectorValue) {
    return selectorValue;
  }

  getType() {
    return 'css';
  }
}

export default CssSelectorStrategy;
