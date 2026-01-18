import ActionStrategy from './ActionStrategy.js';
import Logger from '../../utils/Logger.js';

/**
 * Action strategy for checkbox elements
 * Supports: check, uncheck, or toggle based on value
 */
class CheckboxAction extends ActionStrategy {
  async execute(page, selector, value, options = {}) {
    await this.verifyElement(page, selector);
    
    // Normalize value to boolean
    const shouldCheck = this.normalizeValue(value);
    
    Logger.debug(`${shouldCheck ? 'Checking' : 'Unchecking'} checkbox: ${selector}`);
    
    if (shouldCheck) {
      await page.check(selector);
    } else {
      await page.uncheck(selector);
    }
    
    // Optional delay for UI updates
    const delay = options.delay || 300;
    await page.waitForTimeout(delay);
  }

  /**
   * Normalize various value formats to boolean
   * @param {any} value - Value to normalize
   * @returns {boolean} True to check, false to uncheck
   */
  normalizeValue(value) {
    if (typeof value === 'boolean') {
      return value;
    }
    
    const strValue = String(value).toLowerCase().trim();
    
    // Truthy values
    if (['true', 'yes', '1', 'checked', 'check', 'on'].includes(strValue)) {
      return true;
    }
    
    // Falsy values
    if (['false', 'no', '0', 'unchecked', 'uncheck', 'off', ''].includes(strValue)) {
      return false;
    }
    
    // Default: any non-empty value is truthy
    return !!value;
  }

  getActionType() {
    return 'checkbox';
  }
}

export default CheckboxAction;
