import SelectorFactory from './SelectorFactory.js';
import Logger from '../utils/Logger.js';

/**
 * High-level selector resolver
 * Normalizes selector configuration (string or object) to Playwright-compatible selector
 * 
 * Supports backward compatibility:
 * - String selectors (legacy): Used as-is
 * - Object selectors (new): { by: 'id', value: 'username' }
 */
class SelectorResolver {
  /**
   * Resolve selector configuration to Playwright selector string
   * 
   * @param {string|object} selectorConfig - Selector configuration
   *   - String: Direct CSS selector (backward compatible)
   *   - Object: { by: 'id'|'name'|'css'|'xpath', value: 'selectorValue' }
   * 
   * @returns {string} Playwright-compatible selector
   * 
   * @example
   * // Legacy string format
   * resolve('#username') // Returns: '#username'
   * 
   * @example
   * // New object format
   * resolve({ by: 'id', value: 'username' }) // Returns: '#username'
   * resolve({ by: 'name', value: 'email' }) // Returns: "[name='email']"
   * resolve({ by: 'xpath', value: '//input[@type="text"]' }) // Returns: "xpath=//input[@type='text']"
   */
  resolve(selectorConfig) {
    // Backward compatibility: string selectors
    if (typeof selectorConfig === 'string') {
      Logger.debug(`Using legacy string selector: ${selectorConfig}`);
      return selectorConfig;
    }

    // New object-based selector
    if (typeof selectorConfig === 'object' && selectorConfig !== null) {
      const { by, value } = selectorConfig;

      if (!by) {
        throw new Error(
          'Selector object must have "by" property. ' +
          'Example: { by: "id", value: "username" }'
        );
      }

      if (!value) {
        throw new Error(
          'Selector object must have "value" property. ' +
          'Example: { by: "id", value: "username" }'
        );
      }

      // Create strategy and resolve
      const strategy = SelectorFactory.create(by);
      const resolvedSelector = strategy.resolve(value);
      
      Logger.debug(
        `Resolved selector: ${by}="${value}" -> "${resolvedSelector}"`
      );
      
      return resolvedSelector;
    }

    throw new Error(
      `Invalid selector configuration. Expected string or object with {by, value}, got: ${typeof selectorConfig}`
    );
  }

  /**
   * Check if selector config is using new object format
   * @param {any} selectorConfig - Selector configuration
   * @returns {boolean} True if using new object format
   */
  isObjectFormat(selectorConfig) {
    return typeof selectorConfig === 'object' && 
           selectorConfig !== null && 
           'by' in selectorConfig;
  }
}

export default SelectorResolver;
