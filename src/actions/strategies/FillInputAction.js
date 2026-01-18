import ActionStrategy from './ActionStrategy.js';
import Logger from '../../utils/Logger.js';

/**
 * Action strategy for filling input elements
 * Handles: input[type=text], input[type=email], input[type=password], etc.
 */
class FillInputAction extends ActionStrategy {
  async execute(page, selector, value, options = {}) {
    await this.verifyElement(page, selector);

    Logger.debug(`Filling input: ${selector} with value: ${value}`);

    // Clear existing value first
    await page.fill(selector, '');

    // Fill with new value
    await page.fill(selector, String(value));

    // Optional delay for UI updates
    const delay = options.delay || 300;
    await page.waitForTimeout(delay);
  }

  getActionType() {
    return 'fill-input';
  }
}

export default FillInputAction;
