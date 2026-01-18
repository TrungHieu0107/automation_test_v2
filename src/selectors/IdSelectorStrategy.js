import SelectorStrategy from './SelectorStrategy.js';

/**
 * Resolves ID-based selectors
 * Converts: "username" -> "#username"
 */
class IdSelectorStrategy extends SelectorStrategy {
  /**
   * Resolve ID to CSS selector
   * @param {string} selectorValue - Element ID (without # prefix)
   * @returns {string} CSS ID selector (#id)
   */
  resolve(selectorValue) {
    // Add # prefix if not present
    if (selectorValue.startsWith('#')) {
      return selectorValue;
    }
    return `#${selectorValue}`;
  }

  getType() {
    return 'id';
  }
}

export default IdSelectorStrategy;
