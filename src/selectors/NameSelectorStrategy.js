import SelectorStrategy from './SelectorStrategy.js';

/**
 * Resolves name-based selectors
 * Converts: "username" -> "[name='username']"
 */
class NameSelectorStrategy extends SelectorStrategy {
  /**
   * Resolve name attribute to CSS attribute selector
   * @param {string} selectorValue - Element name attribute value
   * @returns {string} CSS attribute selector [name='value']
   */
  resolve(selectorValue) {
    // Escape quotes in the value
    const escapedValue = selectorValue.replace(/'/g, "\\'");
    return `[name='${escapedValue}']`;
  }

  getType() {
    return 'name';
  }
}

export default NameSelectorStrategy;
