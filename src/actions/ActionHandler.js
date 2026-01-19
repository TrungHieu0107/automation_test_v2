import Logger from '../utils/Logger.js';
import StepReport from '../models/StepReport.js';

/**
 * Handles individual test actions (input, click, dialog)
 */
class ActionHandler {
  constructor(page, screenshotManager) {
    this.page = page;
    this.screenshotManager = screenshotManager;
    this.dialogQueue = [];
    this.isListenerAttached = false;
    this.setupPopupHandler(); // Setup popup window handler
  }

  /**
   * Setup popup window handler
   * Ensures popups opened via window.open() are tracked and focused
   */
  setupPopupHandler() {
    this.page.context().on('page', async popup => {
      Logger.info('Popup window detected');

      // Wait for popup to load
      await popup.waitForLoadState('networkidle');

      // Bring popup to front (makes it active window)
      await popup.bringToFront();

      Logger.debug('Popup window loaded and focused');
    });
  }

  /**
   * Start the global dialog listener for this page
   * Must be called once before actions start
   */
  startDialogListener() {
    if (this.isListenerAttached) return;

    this.page.on('dialog', async dialog => {
      const msg = dialog.message();
      Logger.info(`Dialog detected: ${msg}`);

      if (this.dialogQueue.length > 0) {
        // Handle expected dialog
        const nextAction = this.dialogQueue.shift();
        Logger.step(`Handling dialog with action: ${nextAction.action}`);

        try {
          // Capture screenshot if requested (using screenshot_agent.exe)
          if (nextAction.capture) {
            const delayMs = nextAction.captureDelayMs || 300; // Default 300ms for dialogs

            // Wait for dialog to be fully rendered
            await new Promise(resolve => setTimeout(resolve, delayMs));

            // Use screenshot manager (which uses screenshot_agent.exe)
            const screenshot = await this.screenshotManager.capture(
              this.page,
              nextAction.testName,
              'DIALOG',
              nextAction.stepIndex,
              0 // No additional delay (already waited above)
            );

            if (screenshot && nextAction.step) {
              nextAction.step.attachScreenshot(screenshot);
            }
          }

          // Handle the dialog AFTER screenshot is captured (or failed)
          if (nextAction.action === 'accept') {
            await dialog.accept();
          } else {
            await dialog.dismiss();
          }
        } catch (error) {
          Logger.error(`Failed to process dialog: ${error.message}`);
        }
      } else {
        // Unexpected dialog - dismiss safely
        Logger.warn('Unexpected dialog detected - dismissing');
        try {
          await dialog.dismiss();
        } catch (e) {
          /* ignore */
        }
      }
    });

    this.isListenerAttached = true;
  }

  /**
   * Clear dialog queue (call before test)
   */
  resetDialogQueue() {
    this.dialogQueue = [];
  }

  /**
   * Fill input field
   */
  async fillInput(selector, value, testName, stepIndex) {
    const step = new StepReport('FILL', 'input', selector, value);
    step.start();

    try {
      Logger.step(`Filling input: ${selector}`);
      await this.page.fill(selector, value);

      await this.page.waitForTimeout(300);

      step.pass();

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
  async click(selector, testName, stepIndex, phase = 'SUBMIT') {
    const step = new StepReport(phase, 'click', selector);
    step.start();

    try {
      Logger.step(`Clicking: ${selector}`);

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
   * Queue a dialog action to be handled when the next dialog appears
   */
  async handleDialog(action, testName, stepIndex, capture = false) {
    const step = new StepReport('SUBMIT', 'dialog', 'dialog', action);
    step.start();

    // Check if capture is implicitly set via parameter or needs to be handled
    this.dialogQueue.push({ action, testName, stepIndex, capture, step });
    Logger.step(`Queuing dialog handler: ${action} (capture=${capture})`);

    step.pass();
    return step;
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

      return step;
    } catch (error) {
      Logger.error(`Navigation failed: ${error.message}`);
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
   * Navigate to URL
   */
  async navigate(url, testName, stepIndex) {
    const step = new StepReport('NAVIGATION', 'goto', 'url', url);
    step.start();

    try {
      Logger.step(`Navigating to: ${url}`);
      await this.page.goto(url, { waitUntil: 'networkidle' });
      step.pass();

      return step;
    } catch (error) {
      Logger.error(`Failed to navigate to ${url}: ${error.message}`);
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

export default ActionHandler;
