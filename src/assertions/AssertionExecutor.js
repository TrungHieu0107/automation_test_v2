import AssertionFactory from './AssertionFactory.js';
import SelectorResolver from '../selectors/SelectorResolver.js';
import Logger from '../utils/Logger.js';
import StepReport from '../models/StepReport.js';

/**
 * Coordinates assertion execution with screenshots and reporting
 * Template Method Pattern: Defines assertion execution flow
 */
class AssertionExecutor {
  constructor(page, screenshotManager) {
    this.page = page;
    this.screenshotManager = screenshotManager;
    this.selectorResolver = new SelectorResolver();
  }

  /**
   * Execute assertion(s) based on configuration
   * Supports single or multiple assertions per step
   *
   * @param {object|array} assertConfig - Assertion configuration(s)
   * @param {string} testName - Test name for screenshot naming
   * @param {number} stepIndex - Step index for tracking
   * @returns {Promise<StepReport[]>} Array of assertion step reports
   */
  async execute(assertConfig, testName, stepIndex) {
    // Support both single assertion and array of assertions
    const assertions = Array.isArray(assertConfig) ? assertConfig : [assertConfig];

    const stepReports = [];

    for (let i = 0; i < assertions.length; i++) {
      const assert = assertions[i];
      const currentStepIndex = stepIndex + i;

      const stepReport = await this.executeSingleAssertion(assert, testName, currentStepIndex);

      stepReports.push(stepReport);

      // Stop on first failure if configured
      if (stepReport.status === 'FAIL' && assert.stopOnFailure !== false) {
        Logger.warn('Assertion failed, stopping remaining assertions');
        break;
      }
    }

    return stepReports;
  }

  /**
   * Execute a single assertion
   * @private
   */
  async executeSingleAssertion(assertConfig, testName, stepIndex) {
    // Resolve selector
    const selector = this.selectorResolver.resolve(assertConfig.selector);

    // Create step report
    const step = new StepReport(
      'ASSERT',
      'assertion',
      selector,
      `expect: ${assertConfig.expected}`
    );
    step.start();

    try {
      // Create assertion strategy
      const strategy = AssertionFactory.create(assertConfig.type);

      Logger.step(
        `Asserting ${strategy.getAssertionType()}: ${selector} ` +
          `${assertConfig.operator || '=='} "${assertConfig.expected}"`
      );

      // Execute assertion
      const result = await strategy.execute(
        this.page,
        selector,
        assertConfig.expected,
        assertConfig
      );

      // Update step report based on result
      if (result.passed) {
        Logger.success(`✓ ${result.message}`);
        step.pass();
        step.value = `actual: ${result.actual}`;
      } else {
        Logger.error(`✗ ${result.message}`);
        const error = new Error(result.message);
        step.fail(error);
        step.value = `expected: ${result.expected}, actual: ${result.actual}`;

        // Capture failure screenshot
        const screenshot = await this.screenshotManager.captureOnFailure(
          this.page,
          testName,
          stepIndex
        );

        if (screenshot) {
          step.attachScreenshot(screenshot);
        }
      }

      return step;
    } catch (error) {
      Logger.error(`Assertion error: ${error.message}`);
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

export default AssertionExecutor;
