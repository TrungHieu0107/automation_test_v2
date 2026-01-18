import Logger from '../../utils/Logger.js';

/**
 * Base class for action strategies (Strategy Pattern)
 * 
 * Each strategy knows how to execute a specific action on a specific element type
 * Single Responsibility: Define interface for action execution
 */
class ActionStrategy {
  /**
   * Execute the action on the page
   * 
   * @param {Page} page - Playwright page object
   * @param {string} selector - Resolved Playwright selector
   * @param {any} value - Value for the action (e.g., text to type, option to select)
   * @param {object} options - Additional options for the action
   * @returns {Promise<void>}
   */
  async execute(page, selector, value, options = {}) {
    throw new Error('ActionStrategy.execute() must be implemented by subclass');
  }

  /**
   * Get the action type name
   * @returns {string} Action type identifier
   */
  getActionType() {
    throw new Error('ActionStrategy.getActionType() must be implemented by subclass');
  }

  /**
   * Verify element exists before executing action
   * @param {Page} page - Playwright page
   * @param {string} selector - Element selector
   * @param {number} timeout - Wait timeout in ms
   */
  async verifyElement(page, selector, timeout = 5000) {
    try {
      await page.waitForSelector(selector, { timeout, state: 'visible' });
    } catch (error) {
      Logger.error(`Element not found: ${selector}`);
      throw new Error(`Element not found or not visible: ${selector}`);
    }
  }
}

export default ActionStrategy;
