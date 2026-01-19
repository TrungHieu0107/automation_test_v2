import path from 'path';
import fs from 'fs-extra';
import Logger from '../utils/Logger.js';
import { execFile } from 'child_process';

/**
 * Screenshot capture and management
 * Uses screenshot_agent.exe as single source of truth for all captures
 */
class ScreenshotManager {
  constructor(outputDir, config) {
    this.outputDir = outputDir;
    this.config = config;
    this.screenshotsDir = path.join(outputDir, 'screenshots');
    this.hasExplicitCapture = false; // Track if any step has explicit capture
    this.ensureDirectoryExists();
  }

  /**
   * Ensure screenshots directory exists
   */
  ensureDirectoryExists() {
    fs.ensureDirSync(this.screenshotsDir);
  }

  /**
   * Generate screenshot filename
   */
  generateFilename(testName, phase, stepIndex) {
    const timestamp = Date.now();
    const sanitizedTestName = testName.replace(/[^a-z0-9]/gi, '_');
    return `${sanitizedTestName}_${phase}_${stepIndex}_${timestamp}.png`;
  }

  /**
   * Execute screenshot_agent.exe to capture active window
   * @param {string} outputPath - Absolute path to save screenshot
   */
  async executeScreenshotAgent(outputPath) {
    return new Promise((resolve, reject) => {
      // Use screenshot agent from project root
      const agentPath = path.resolve(process.cwd(), 'screenshot_agent.exe');

      if (!fs.existsSync(agentPath)) {
        return reject(new Error(`screenshot_agent.exe not found at ${agentPath}`));
      }

      execFile(agentPath, [outputPath], { windowsHide: true }, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Capture screenshot using screenshot_agent.exe
   * Single source of truth for all screenshot captures
   */
  async capture(page, testName, phase, stepIndex) {
    if (!this.config.screenshots || !this.config.screenshots.enabled) {
      return null;
    }

    try {
      const filename = this.generateFilename(testName, phase, stepIndex);
      const filepath = path.join(this.screenshotsDir, filename);

      // Ensure directory exists
      await fs.ensureDir(path.dirname(filepath));

      // Bring browser window to front to ensure it's the active window
      await page.bringToFront();

      // Small delay to ensure window is active
      await page.waitForTimeout(100);

      // Execute screenshot_agent.exe to capture active window
      await this.executeScreenshotAgent(filepath);

      Logger.debug(`Screenshot captured: ${filename}`);

      // Return relative path for HTML report
      return `screenshots/${filename}`;
    } catch (error) {
      // Log as warning, don't fail the test
      Logger.warn(`Screenshot capture failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Capture screenshot on failure
   */
  async captureOnFailure(page, testName, stepIndex) {
    if (!this.config.screenshots || !this.config.screenshots.onFailure) {
      return null;
    }

    return await this.capture(page, testName, 'FAILURE', stepIndex);
  }

  /**
   * Mark that a step has explicit capture configured
   * Called by ActionExecutor when capture: true is found
   */
  markExplicitCapture() {
    this.hasExplicitCapture = true;
  }

  /**
   * Reset explicit capture tracking (call at start of each test)
   */
  resetCaptureTracking() {
    this.hasExplicitCapture = false;
  }

  /**
   * Check if fallback screenshots should be captured
   * @returns {boolean} True if no explicit captures configured
   */
  shouldCaptureFallback() {
    return !this.hasExplicitCapture;
  }

  /**
   * Capture fallback screenshot before submit
   * Only captures if no explicit captures have been configured
   */
  async captureFallbackBeforeSubmit(page, testName, stepIndex) {
    if (!this.config.screenshots || !this.config.screenshots.enabled) {
      return null;
    }

    if (this.shouldCaptureFallback()) {
      Logger.debug('Fallback: capturing before submit (no explicit captures)');
      return await this.capture(page, testName, 'FALLBACK_BEFORE_SUBMIT', stepIndex);
    }

    return null;
  }

  /**
   * Capture fallback screenshot after submit/navigation
   * Only captures if no explicit captures have been configured
   */
  async captureFallbackAfterSubmit(page, testName, stepIndex) {
    if (!this.config.screenshots || !this.config.screenshots.enabled) {
      return null;
    }

    if (this.shouldCaptureFallback()) {
      Logger.debug('Fallback: capturing after submit (no explicit captures)');
      return await this.capture(page, testName, 'FALLBACK_AFTER_SUBMIT', stepIndex);
    }

    return null;
  }
}

export default ScreenshotManager;
