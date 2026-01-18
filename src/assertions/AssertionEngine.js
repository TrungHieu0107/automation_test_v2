import Logger from '../utils/Logger.js';
import StepReport from '../models/StepReport.js';

/**
 * Assertion engine with detailed tracking
 */
class AssertionEngine {
  constructor(page, screenshotManager) {
    this.page = page;
    this.screenshotManager = screenshotManager;
  }

  /**
   * Assert text content - works with ALL HTML tags (span, div, p, etc.)
   */
  async assertText(
    selector,
    expectedText,
    testName,
    stepIndex,
    operator = 'equals',
    timeout = 10000
  ) {
    const step = new StepReport('ASSERT', 'assertion', selector, `expect: ${expectedText}`);
    step.start();

    try {
      Logger.step(`Asserting text at ${selector}: "${expectedText}" (${operator})`);

      // Wait for element to be attached to DOM (not necessarily visible)
      // This allows reading text from hidden elements (display:none)
      await this.page.waitForSelector(selector, { timeout, state: 'attached' });

      // Get actual text using textContent() - works for ALL HTML elements
      // (span, div, p, h1-h6, td, li, button, label, etc.)
      const element = await this.page.$(selector);
      const actualText = await element.textContent();

      // Perform comparison based on operator
      let passed = false;
      const trimmedActual = actualText.trim();
      const trimmedExpected = expectedText.trim();

      switch (operator) {
        case 'equals':
          passed = trimmedActual === trimmedExpected;
          break;
        case 'contains':
          passed = trimmedActual.includes(trimmedExpected);
          break;
        case 'regex':
          const regex = new RegExp(trimmedExpected);
          passed = regex.test(trimmedActual);
          break;
        default:
          passed = trimmedActual === trimmedExpected;
      }

      if (passed) {
        Logger.success(`✓ Assertion passed: "${trimmedActual}"`);
        step.pass();
        step.value = `actual: ${trimmedActual}`;
      } else {
        const error = new Error(
          `Assertion failed: Expected ${operator} "${trimmedExpected}", but got "${trimmedActual}"`
        );
        Logger.error(error.message);
        step.fail(error);
        step.value = `expected (${operator}): ${trimmedExpected}, actual: ${trimmedActual}`;

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

  /**
   * Assert element visibility (visible or hidden)
   */
  async assertVisibility(selector, expectedState, testName, stepIndex, timeout = 10000) {
    const step = new StepReport('ASSERT', 'assertion', selector, `visibility: ${expectedState}`);
    step.start();

    try {
      Logger.step(`Asserting visibility at ${selector}: "${expectedState}"`);

      // Wait for element to exist in DOM
      await this.page.waitForSelector(selector, { timeout, state: 'attached' });

      // Check visibility state
      const element = await this.page.$(selector);
      const isVisible = await element.isVisible();

      const passed =
        (expectedState === 'visible' && isVisible) || (expectedState === 'hidden' && !isVisible);

      if (passed) {
        Logger.success(`✓ Visibility assertion passed: ${expectedState}`);
        step.pass();
        step.value = `actual: ${isVisible ? 'visible' : 'hidden'}`;
      } else {
        const actualState = isVisible ? 'visible' : 'hidden';
        const error = new Error(
          `Visibility assertion failed: Expected "${expectedState}", but element is "${actualState}"`
        );
        Logger.error(error.message);
        step.fail(error);
        step.value = `expected: ${expectedState}, actual: ${actualState}`;

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
      Logger.error(`Visibility assertion error: ${error.message}`);
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

  /**
   * Assert element exists
   */
  async assertExists(selector, testName, stepIndex, timeout = 10000) {
    const step = new StepReport('ASSERT', 'assertion', selector, 'exists');
    step.start();

    try {
      Logger.step(`Asserting element exists: ${selector}`);

      await this.page.waitForSelector(selector, { timeout, state: 'visible' });
      Logger.success(`✓ Element exists: ${selector}`);
      step.pass();

      return step;
    } catch (error) {
      Logger.error(`Element not found: ${selector}`);
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

  /**
   * Assert URL contains
   */
  async assertUrlContains(expectedUrl, testName, stepIndex, timeout = 10000) {
    const step = new StepReport('ASSERT', 'assertion', 'url', expectedUrl);
    step.start();

    try {
      Logger.step(`Asserting URL contains: ${expectedUrl}`);

      await this.page.waitForFunction(url => window.location.href.includes(url), expectedUrl, {
        timeout,
      });

      const actualUrl = this.page.url();
      Logger.success(`✓ URL assertion passed: ${actualUrl}`);
      step.pass();
      step.value = `actual: ${actualUrl}`;

      return step;
    } catch (error) {
      const actualUrl = this.page.url();
      const errorMsg = `URL assertion failed: Expected URL to contain "${expectedUrl}", but got "${actualUrl}"`;
      Logger.error(errorMsg);

      const err = new Error(errorMsg);
      step.fail(err);
      step.value = `expected: ${expectedUrl}, actual: ${actualUrl}`;

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

export default AssertionEngine;
