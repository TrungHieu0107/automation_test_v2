import FillInputAction from './strategies/FillInputAction.js';
import FillTextareaAction from './strategies/FillTextareaAction.js';
import SelectDropdownAction from './strategies/SelectDropdownAction.js';
import CheckboxAction from './strategies/CheckboxAction.js';
import RadioButtonAction from './strategies/RadioButtonAction.js';
import ClickAction from './strategies/ClickAction.js';
import Logger from '../utils/Logger.js';

/**
 * Factory for creating action strategies (Factory Pattern)
 *
 * Can create strategies by:
 * 1. Explicit action type (from YAML config)
 * 2. Auto-detection based on element type
 */
class ActionFactory {
  /**
   * Create action strategy
   *
   * @param {Page} page - Playwright page (for auto-detection)
   * @param {string} selector - Element selector (for auto-detection)
   * @param {string} actionType - Explicit action type (optional)
   * @returns {Promise<ActionStrategy>} Action strategy instance
   */
  static async create(page, selector, actionType = null) {
    // If explicit action type provided, use it
    if (actionType) {
      return this.createByType(actionType);
    }

    // Otherwise, auto-detect based on element
    const elementType = await this.detectElementType(page, selector);
    return this.createByElementType(elementType);
  }

  /**
   * Create strategy by explicit action type
   * @param {string} actionType - Action type identifier
   * @returns {ActionStrategy} Action strategy instance
   */
  static createByType(actionType) {
    switch (actionType?.toLowerCase()) {
      case 'fill-input':
      case 'input':
        return new FillInputAction();

      case 'fill-textarea':
      case 'textarea':
        return new FillTextareaAction();

      case 'select-dropdown':
      case 'select':
        return new SelectDropdownAction();

      case 'checkbox':
        return new CheckboxAction();

      case 'radio-button':
      case 'radio':
        return new RadioButtonAction();

      case 'click':
        return new ClickAction();

      default:
        throw new Error(
          `Unsupported action type: "${actionType}". ` +
            `Supported: fill-input, fill-textarea, select-dropdown, checkbox, radio-button, click`
        );
    }
  }

  /**
   * Create strategy by detected element type
   * @param {string} elementType - Detected element type
   * @returns {ActionStrategy} Action strategy instance
   */
  static createByElementType(elementType) {
    switch (elementType) {
      case 'input':
        return new FillInputAction();

      case 'textarea':
        return new FillTextareaAction();

      case 'select':
        return new SelectDropdownAction();

      case 'checkbox':
        return new CheckboxAction();

      case 'radio':
        return new RadioButtonAction();

      default:
        // Default to input for unknown types
        Logger.warn(`Unknown element type: ${elementType}, defaulting to input action`);
        return new FillInputAction();
    }
  }

  /**
   * Auto-detect element type from page
   * @param {Page} page - Playwright page
   * @param {string} selector - Element selector
   * @returns {Promise<string>} Element type
   */
  static async detectElementType(page, selector) {
    try {
      // Evaluate element properties in browser context
      const elementInfo = await page.$eval(selector, el => {
        const tagName = el.tagName.toLowerCase();
        const type = el.getAttribute('type')?.toLowerCase();

        return {
          tagName,
          type,
          isCheckbox: type === 'checkbox',
          isRadio: type === 'radio',
        };
      });

      Logger.debug(`Detected element: ${elementInfo.tagName}, type: ${elementInfo.type}`);

      // Determine element type
      if (elementInfo.tagName === 'textarea') {
        return 'textarea';
      }

      if (elementInfo.tagName === 'select') {
        return 'select';
      }

      if (elementInfo.tagName === 'input') {
        if (elementInfo.isCheckbox) {
          return 'checkbox';
        }
        if (elementInfo.isRadio) {
          return 'radio';
        }
        return 'input';
      }

      // Default to input for other elements
      return 'input';
    } catch (error) {
      Logger.warn(`Failed to detect element type for ${selector}: ${error.message}`);
      return 'input'; // Default fallback
    }
  }

  /**
   * Get list of supported action types
   * @returns {string[]} Array of supported action type names
   */
  static getSupportedTypes() {
    return ['fill-input', 'fill-textarea', 'select-dropdown', 'checkbox', 'radio-button', 'click'];
  }
}

export default ActionFactory;
