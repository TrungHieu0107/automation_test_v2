import AssertionStrategy from './AssertionStrategy.js';
import Logger from '../../utils/Logger.js';

/**
 * Assertion strategy for element enabled/disabled state
 */
class EnabledAssertion extends AssertionStrategy {
  async execute(page, selector, expected, options = {}) {
    const timeout = options.timeout || 10000;
    
    // Normalize expected to boolean
    const shouldBeEnabled = this.normalizeEnabled(expected);
    
    Logger.debug(`Enabled assertion: element should be ${shouldBeEnabled ? 'enabled' : 'disabled'}`);
    
    try {
      // Wait for element to exist
      await page.waitForSelector(selector, { timeout });
      
      // Check if element is enabled
      const isEnabled = await page.isEnabled(selector);
      
      if (shouldBeEnabled) {
        // Assert enabled
        if (isEnabled) {
          return this.createSuccessResult(
            'enabled',
            'enabled',
            `Element is enabled: ${selector}`
          );
        } else {
          return this.createFailureResult(
            'disabled',
            'enabled',
            `Expected element to be enabled, but it is disabled: ${selector}`
          );
        }
      } else {
        // Assert disabled
        if (!isEnabled) {
          return this.createSuccessResult(
            'disabled',
            'disabled',
            `Element is disabled: ${selector}`
          );
        } else {
          return this.createFailureResult(
            'enabled',
            'disabled',
            `Expected element to be disabled, but it is enabled: ${selector}`
          );
        }
      }
    } catch (error) {
      return this.createFailureResult(
        'unknown',
        shouldBeEnabled ? 'enabled' : 'disabled',
        `Enabled assertion failed: ${error.message}`
      );
    }
  }

  /**
   * Normalize enabled value to boolean
   * @param {any} value - Enabled value
   * @returns {boolean} True for enabled, false for disabled
   */
  normalizeEnabled(value) {
    if (typeof value === 'boolean') {
      return value;
    }
    
    const strValue = String(value).toLowerCase().trim();
    
    // Enabled values
    if (['true', 'enabled', 'yes', '1'].includes(strValue)) {
      return true;
    }
    
    // Disabled values
    if (['false', 'disabled', 'no', '0'].includes(strValue)) {
      return false;
    }
    
    // Default to checking enabled
    return !!value;
  }

  getAssertionType() {
    return 'enabled';
  }
}

export default EnabledAssertion;
