import ActionStrategy from './ActionStrategy.js';
import Logger from '../../utils/Logger.js';

/**
 * Action strategy for select dropdown elements
 * Supports selection by: value, label, or index
 */
class SelectDropdownAction extends ActionStrategy {
  async execute(page, selector, value, options = {}) {
    await this.verifyElement(page, selector);

    const selectBy = options.selectBy || 'value'; // 'value', 'label', 'index'

    Logger.debug(`Selecting option in dropdown ${selector} by ${selectBy}: ${value}`);

    switch (selectBy) {
      case 'value':
        await page.selectOption(selector, { value: String(value) });
        break;

      case 'label':
        await page.selectOption(selector, { label: String(value) });
        break;

      case 'index':
        await page.selectOption(selector, { index: parseInt(value, 10) });
        break;

      default:
        throw new Error(
          `Invalid selectBy option: "${selectBy}". ` + `Supported: value, label, index`
        );
    }

    // Optional delay for UI updates
    const delay = options.delay || 300;
    await page.waitForTimeout(delay);
  }

  getActionType() {
    return 'select-dropdown';
  }
}

export default SelectDropdownAction;
