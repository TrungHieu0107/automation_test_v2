import SelectorStrategy from './SelectorStrategy.js';

/**
 * Resolves XPath selectors
 * Ensures proper xpath= prefix for Playwright
 */
class XPathSelectorStrategy extends SelectorStrategy {
  /**
   * Resolve XPath selector with proper Playwright prefix
   * @param {string} selectorValue - XPath expression
   * @returns {string} Playwright XPath selector (xpath=...)
   */
  resolve(selectorValue) {
    // Remove existing xpath prefix if present
    const xpath = selectorValue.replace(/^xpath=/, '');
    
    // Add Playwright's xpath= prefix
    return `xpath=${xpath}`;
  }

  getType() {
    return 'xpath';
  }
}

export default XPathSelectorStrategy;
