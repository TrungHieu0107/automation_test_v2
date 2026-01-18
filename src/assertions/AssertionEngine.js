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

      // 1. Wait for element to be attached first
      await this.page.waitForSelector(selector, { timeout, state: 'attached' });

      // 2. Poll for text match until timeout
      const startTime = Date.now();
      let actualText = '';
      let passed = false;
      const trimExpected = expectedText.trim();

      while (Date.now() - startTime < timeout) {
        // Get current text
        const element = await this.page.$(selector);
        // Handle case where element might briefly detach
        if (!element) {
          await this.page.waitForTimeout(100);
          continue;
        }

        actualText = (await element.textContent()) || '';
        const trimActual = actualText.trim();

        // Check match
        switch (operator) {
          case 'equals':
            passed = trimActual === trimExpected;
            break;
          case 'contains':
            passed = trimActual.includes(trimExpected);
            break;
          case 'regex':
            const regex = new RegExp(trimExpected);
            passed = regex.test(trimActual);
            break;
          default:
            passed = trimActual === trimExpected;
        }

        if (passed) break;

        // Wait before retry
        await this.page.waitForTimeout(100);
      }

      const trimmedActual = actualText.trim();
      const trimmedExpected = trimExpected;

      if (passed) {
        Logger.success(`✓ Assertion passed: "${trimmedActual}"`);
        step.pass();
        step.value = `actual: ${trimmedActual}`;
      } else {
        const error = new Error(
          `Assertion failed: Expected ${operator} "${trimmedExpected}", but got "${trimmedActual}" (after ${timeout}ms)`
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
