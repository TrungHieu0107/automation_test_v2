import ActionFactory from './ActionFactory.js';
import SelectorResolver from '../selectors/SelectorResolver.js';
import Logger from '../utils/Logger.js';
import StepReport from '../models/StepReport.js';

/**
 * Coordinates action execution with screenshots and reporting
 * Template Method Pattern: Defines execution flow
 */
class ActionExecutor {
  constructor(page, screenshotManager) {
    this.page = page;
    this.screenshotManager = screenshotManager;
    this.selectorResolver = new SelectorResolver();
  }

  /**
   * Execute an action based on step configuration
   *
   * @param {object} stepConfig - Step configuration from YAML
   * @param {string} testName - Test name for screenshot naming
   * @param {number} stepIndex - Step index for tracking
   * @param {string} phase - Execution phase (FILL, SUBMIT, ASSERT)
   * @returns {Promise<StepReport>} Step execution report
   */
  async execute(stepConfig, testName, stepIndex, phase = 'FILL') {
    // Resolve selector
    const selector = this.selectorResolver.resolve(stepConfig.selector);

    // Determine action type and value
    const actionType = stepConfig.action || stepConfig.type;
    const value = stepConfig.value || stepConfig.inputValue || '';

    // Create step report
    const step = new StepReport(phase, actionType || 'fill', selector, value);
    step.start();

    try {
      // Create action strategy
      const action = await ActionFactory.create(this.page, selector, actionType);

      Logger.step(`Executing ${action.getActionType()}: ${selector}`);

      // Execute action with options
      await action.execute(this.page, selector, value, stepConfig.options || {});

      step.pass();

      // Handle screenshot if configured for this step
      if (stepConfig.capture === true) {
        Logger.debug(`Capturing screenshot (explicit capture=true)`);
        this.screenshotManager.markExplicitCapture();

        // Extract optional screenshot delay
        const captureDelayMs = stepConfig.captureDelayMs || 0;

        const screenshot = await this.screenshotManager.capture(
          this.page,
          testName,
          phase,
          stepIndex,
          captureDelayMs
        );

        if (screenshot) {
          step.attachScreenshot(screenshot);
        }
      }

      return step;
    } catch (error) {
      Logger.error(`Action failed: ${error.message}`);
      step.fail(error);

      // Capture failure screenshot
      const screenshot = await this.screenshotManager.captureOnFailure(
        this.page,
        testName,
        stepIndex
      );

      if (screenshot) {
        step.attachScreenshot(screenshot);
      }

      return step;
    }
  }
}

export default ActionExecutor;
