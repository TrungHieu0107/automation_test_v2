import ActionStrategy from './ActionStrategy.js';
import Logger from '../../utils/Logger.js';

/**
 * Action strategy for click actions
 * Handles any clickable element
 */
class ClickAction extends ActionStrategy {
  async execute(page, selector, value, options = {}) {
    await this.verifyElement(page, selector);
    
    Logger.debug(`Clicking element: ${selector}`);
    
    // Perform click
    await page.click(selector);
    
    // Optional delay after click
    const delay = options.delay || 300;
    await page.waitForTimeout(delay);
  }

  getActionType() {
    return 'click';
  }
}

export default ClickAction;
