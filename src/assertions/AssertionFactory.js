import TextContentAssertion from './strategies/TextContentAssertion.js';
import InputValueAssertion from './strategies/InputValueAssertion.js';
import VisibilityAssertion from './strategies/VisibilityAssertion.js';
import EnabledAssertion from './strategies/EnabledAssertion.js';
import StyleAssertion from './strategies/StyleAssertion.js';

/**
 * Factory for creating assertion strategies (Factory Pattern)
 */
class AssertionFactory {
  /**
   * Create assertion strategy based on type
   * @param {string} assertionType - Assertion type identifier
   * @returns {AssertionStrategy} Assertion strategy instance
   */
  static create(assertionType) {
    switch (assertionType?.toLowerCase()) {
      case 'textcontent':
      case 'text':
        return new TextContentAssertion();
      
      case 'inputvalue':
      case 'value':
        return new InputValueAssertion();
      
      case 'visibility':
      case 'visible':
      case 'hidden':
        return new VisibilityAssertion();
      
      case 'enabled':
      case 'disabled':
        return new EnabledAssertion();
      
      case 'style':
      case 'css':
        return new StyleAssertion();
      
      default:
        throw new Error(
          `Unsupported assertion type: "${assertionType}". ` +
          `Supported: textContent, inputValue, visibility, enabled, style`
        );
    }
  }

  /**
   * Get list of supported assertion types
   * @returns {string[]} Array of supported assertion type names
   */
  static getSupportedTypes() {
    return [
      'textContent',
      'inputValue',
      'visibility',
      'enabled',
      'style'
    ];
  }
}

export default AssertionFactory;
