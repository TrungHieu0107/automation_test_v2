import ActionStrategy from './ActionStrategy.js';
import Logger from '../../utils/Logger.js';

/**
 * Action strategy for radio button elements
 * Selects a specific radio button within a group
 */
class RadioButtonAction extends ActionStrategy {
  async execute(page, selector, value, options = {}) {
    await this.verifyElement(page, selector);
    
    Logger.debug(`Selecting radio button: ${selector}`);
    
    // Radio buttons are selected by clicking them
    await page.check(selector);
    
    // Optional delay for UI updates
    const delay = options.delay || 300;
    await page.waitForTimeout(delay);
  }

  getActionType() {
    return 'radio-button';
  }
}

export default RadioButtonAction;
