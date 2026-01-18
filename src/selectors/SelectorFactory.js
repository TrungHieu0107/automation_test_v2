import IdSelectorStrategy from './IdSelectorStrategy.js';
import NameSelectorStrategy from './NameSelectorStrategy.js';
import CssSelectorStrategy from './CssSelectorStrategy.js';
import XPathSelectorStrategy from './XPathSelectorStrategy.js';

/**
 * Factory for creating selector strategies (Factory Pattern)
 * Single Responsibility: Create and return appropriate selector strategy
 */
class SelectorFactory {
  /**
   * Create a selector strategy based on type
   * @param {string} type - Selector type: 'id', 'name', 'css', 'xpath'
   * @returns {SelectorStrategy} Appropriate selector strategy instance
   * @throws {Error} If selector type is not supported
   */
  static create(type) {
    switch (type?.toLowerCase()) {
      case 'id':
        return new IdSelectorStrategy();
      
      case 'name':
        return new NameSelectorStrategy();
      
      case 'css':
        return new CssSelectorStrategy();
      
      case 'xpath':
        return new XPathSelectorStrategy();
      
      default:
        throw new Error(
          `Unsupported selector type: "${type}". ` +
          `Supported types: id, name, css, xpath`
        );
    }
  }

  /**
   * Get list of supported selector types
   * @returns {string[]} Array of supported selector type names
   */
  static getSupportedTypes() {
    return ['id', 'name', 'css', 'xpath'];
  }
}

export default SelectorFactory;
