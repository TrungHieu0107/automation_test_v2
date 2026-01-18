import ActionStrategy from './ActionStrategy.js';
import Logger from '../../utils/Logger.js';

/**
 * Action strategy for filling textarea elements
 */
class FillTextareaAction extends ActionStrategy {
  async execute(page, selector, value, options = {}) {
    await this.verifyElement(page, selector);

    Logger.debug(`Filling textarea: ${selector}`);

    // Clear existing value
    await page.fill(selector, '');

    // Fill with new value (can be multi-line)
    await page.fill(selector, String(value));

    // Optional delay for UI updates
    const delay = options.delay || 300;
    await page.waitForTimeout(delay);
  }

  getActionType() {
    return 'fill-textarea';
  }
}

export default FillTextareaAction;
