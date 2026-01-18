import AssertionStrategy from './AssertionStrategy.js';
import Logger from '../../utils/Logger.js';

/**
 * Assertion strategy for element visibility
 * Validates if element is visible or hidden
 */
class VisibilityAssertion extends AssertionStrategy {
  async execute(page, selector, expected, options = {}) {
    const timeout = options.timeout || 10000;
    
    // Normalize expected to boolean
    const shouldBeVisible = this.normalizeVisibility(expected);
    
    Logger.debug(`Visibility assertion: element should be ${shouldBeVisible ? 'visible' : 'hidden'}`);
    
    try {
      if (shouldBeVisible) {
        // Assert element is visible
        await page.waitForSelector(selector, { 
          timeout, 
          state: 'visible' 
        });
        
        const isVisible = await page.isVisible(selector);
        
        if (isVisible) {
          return this.createSuccessResult(
            'visible',
            'visible',
            `Element is visible: ${selector}`
          );
        } else {
          return this.createFailureResult(
            'hidden',
            'visible',
            `Expected element to be visible, but it is hidden: ${selector}`
          );
        }
      } else {
        // Assert element is hidden
        await page.waitForSelector(selector, { 
          timeout, 
          state: 'hidden' 
        });
        
        const isVisible = await page.isVisible(selector);
        
        if (!isVisible) {
          return this.createSuccessResult(
            'hidden',
            'hidden',
            `Element is hidden: ${selector}`
          );
        } else {
          return this.createFailureResult(
            'visible',
            'hidden',
            `Expected element to be hidden, but it is visible: ${selector}`
          );
        }
      }
    } catch (error) {
      // Timeout - element did not reach expected state
      const actual = shouldBeVisible ? 'hidden' : 'visible';
      const expected = shouldBeVisible ? 'visible' : 'hidden';
      
      return this.createFailureResult(
        actual,
        expected,
        `Visibility assertion failed: ${error.message}`
      );
    }
  }

  /**
   * Normalize visibility value to boolean
   * @param {any} value - Visibility value
   * @returns {boolean} True for visible, false for hidden
   */
  normalizeVisibility(value) {
    if (typeof value === 'boolean') {
      return value;
    }
    
    const strValue = String(value).toLowerCase().trim();
    
    // Visible values
    if (['true', 'visible', 'shown', 'yes', '1'].includes(strValue)) {
      return true;
    }
    
    // Hidden values  
    if (['false', 'hidden', 'invisible', 'no', '0'].includes(strValue)) {
      return false;
    }
    
    // Default to checking visibility
    return !!value;
  }

  getAssertionType() {
    return 'visibility';
  }
}

export default VisibilityAssertion;
