import Logger from '../utils/Logger.js';
import StepReport from '../models/StepReport.js';

/**
 * Handles individual test actions (input, click, dialog)
 */
class ActionHandler {
  constructor(page, screenshotManager) {
    this.page = page;
    this.screenshotManager = screenshotManager;
  }

  /**
   * Fill input field
   */
  async fillInput(selector, value, testName, stepIndex, capture = false) {
    const step = new StepReport('FILL', 'input', selector, value);
    step.start();

    try {
      Logger.step(`Filling input: ${selector}${capture ? ' (with capture)' : ''}`);
      await this.page.fill(selector, value);

      // Small delay for UI update
      await this.page.waitForTimeout(300);

      step.pass();

      // Capture screenshot after filling if requested
      if (capture) {
        const screenshot = await this.screenshotManager.capture(
          this.page,
          testName,
          'FILL',
          stepIndex
        );
        if (screenshot) {
          step.attachScreenshot(screenshot);
        }
      }

      return step;
    } catch (error) {
      Logger.error(`Failed to fill input ${selector}: ${error.message}`);
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
   * Click element
   */
  async click(selector, testName, stepIndex, phase = 'SUBMIT', capture = false) {
    const step = new StepReport(phase, 'click', selector);
    step.start();

    try {
      Logger.step(`Clicking: ${selector}${capture ? ' (with capture)' : ''}`);

      // Capture screenshot before/after click if requested
      if (capture) {
        const screenshot = await this.screenshotManager.capture(
          this.page,
          testName,
          phase,
          stepIndex
        );
        if (screenshot) {
          step.attachScreenshot(screenshot);
        }
      }

      await this.page.click(selector);
      step.pass();

      return step;
    } catch (error) {
      Logger.error(`Failed to click ${selector}: ${error.message}`);
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
   * Handle dialog (alert, confirm, prompt)
   */
  async handleDialog(action, testName, stepIndex, capture = false) {
    const step = new StepReport('SUBMIT', 'dialog', 'dialog', action);
    step.start();

    try {
      Logger.step(`Handling dialog: ${action}${capture ? ' (with capture)' : ''}`);

      // Set up dialog handler
      this.page.once('dialog', async dialog => {
        Logger.info(`Dialog detected: ${dialog.message()}`);

        if (action === 'accept') {
          await dialog.accept();
        } else {
          await dialog.dismiss();
        }
      });

      step.pass();
      // Capture screenshot of dialog if requested
      if (capture) {
        const screenshot = await this.screenshotManager.capture(
          this.page,
          testName,
          'DIALOG',
          stepIndex
        );
        if (screenshot) {
          step.attachScreenshot(screenshot);
        }
      }
      return step;
    } catch (error) {
      Logger.error(`Failed to handle dialog: ${error.message}`);
      step.fail(error);
      return step;
    }
  }

  /**
   * Wait for navigation
   */
  async waitForNavigation(testName, stepIndex, timeout = 30000) {
    const step = new StepReport('SUBMIT', 'navigation', 'page');
    step.start();

    try {
      Logger.step('Waiting for navigation...');
      await this.page.waitForLoadState('networkidle', { timeout });
      step.pass();

      // Capture screenshot after navigation
      const screenshot = await this.screenshotManager.captureAfterNavigation(
        this.page,
        testName,
        stepIndex
      );
      if (screenshot) {
        step.attachScreenshot(screenshot);
      }

      return step;
    } catch (error) {
      Logger.error(`Navigation failed: ${error.message}`);
      step.fail(error);
      return step;
    }
  }

  /**
   * Navigate to URL
   */
  async navigate(url, testName, stepIndex) {
    const step = new StepReport('FILL', 'navigate', url);
    step.start();

    try {
      Logger.step(`Navigating to: ${url}`);
      await this.page.goto(url, { waitUntil: 'networkidle' });
      step.pass();

      // Capture screenshot after navigation
      const screenshot = await this.screenshotManager.capture(
        this.page,
        testName,
        'NAVIGATION',
        stepIndex
      );
      if (screenshot) {
        step.attachScreenshot(screenshot);
      }

      return step;
    } catch (error) {
      Logger.error(`Failed to navigate to ${url}: ${error.message}`);
      step.fail(error);

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

export default ActionHandler;
