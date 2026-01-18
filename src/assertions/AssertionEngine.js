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
   * Assert text content
   */
  async assertText(selector, expectedText, testName, stepIndex, timeout = 10000) {
    const step = new StepReport('ASSERT', 'assertion', selector, `expect: ${expectedText}`);
    step.start();

    try {
      Logger.step(`Asserting text at ${selector}: "${expectedText}"`);
      
      // Wait for element
      await this.page.waitForSelector(selector, { timeout });
      
      // Get actual text
      const element = await this.page.$(selector);
      const actualText = await element.textContent();
      
      // Compare
      if (actualText.trim() === expectedText.trim()) {
        Logger.success(`✓ Assertion passed: "${actualText}"`);
        step.pass();
        step.value = `actual: ${actualText}`;
      } else {
        const error = new Error(
          `Assertion failed: Expected "${expectedText}", but got "${actualText}"`
        );
        Logger.error(error.message);
        step.fail(error);
        step.value = `expected: ${expectedText}, actual: ${actualText}`;
        
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
      
      await this.page.waitForFunction(
        (url) => window.location.href.includes(url),
        expectedUrl,
        { timeout }
      );
      
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
