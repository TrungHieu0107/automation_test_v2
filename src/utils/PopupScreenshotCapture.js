import { chromium } from 'playwright';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import Logger from './Logger.js';

const execAsync = promisify(exec);

/**
 * Popup Screenshot Capture
 * Opens test URL in a popup window and captures it using screenshot_agent.exe
 */
class PopupScreenshotCapture {
  constructor(config) {
    this.config = config;
    this.popupConfig = config.popupScreenshot || {};
    this.browserConfig = config.browser || {};
  }

  /**
   * Capture popup from test file
   * @param {string} testFilePath - Path to YAML test file
   */
  async captureFromTestFile(testFilePath) {
    if (!this.popupConfig.enabled) {
      Logger.warn('Popup screenshot is disabled in config.yaml');
      return;
    }

    try {
      // Load test file to get URL
      const testData = yaml.load(fs.readFileSync(testFilePath, 'utf8'));
      const url = testData.url;

      if (!url) {
        throw new Error(`No URL found in test file: ${testFilePath}`);
      }

      Logger.info(`Opening popup for URL: ${url}`);
      await this.capturePopup(url);
    } catch (error) {
      Logger.error(`Failed to capture popup: ${error.message}`);
      throw error;
    }
  }

  /**
   * Main capture function
   * @param {string} url - URL to open and capture
   */
  async capturePopup(url) {
    let browser = null;
    let context = null;
    let page = null;

    try {
      // Ensure output directory exists
      const outputDir = path.resolve(this.popupConfig.outputDir || 'screenshots/popup/');
      await fs.ensureDir(outputDir);

      // Generate output path
      const outputPath = this.generateOutputPath(outputDir);
      Logger.info(`Screenshot will be saved to: ${outputPath}`);

      // Launch browser
      Logger.info('Launching browser...');
      const browserType =
        this.browserConfig.type === 'msedge' ? 'chromium' : this.browserConfig.type;
      browser = await chromium.launch({
        headless: false,
        channel: this.browserConfig.type === 'msedge' ? 'msedge' : undefined,
      });

      // Create context with popup dimensions
      const { width, height } = this.popupConfig.windowDimensions || { width: 1280, height: 800 };
      context = await browser.newContext({
        viewport: { width, height },
      });

      // Create page
      page = await context.newPage();

      // Navigate to URL
      Logger.info(`Navigating to: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle' });

      // Wait additional time for dynamic content
      const waitTime = this.popupConfig.waitAfterLoad || 2000;
      Logger.info(`Waiting ${waitTime}ms for content to load...`);
      await page.waitForTimeout(waitTime);

      // Bring browser window to front
      await page.bringToFront();

      // Execute screenshot agent
      Logger.info('Capturing window with screenshot_agent.exe...');
      await this.executeScreenshotAgent(outputPath);

      Logger.success(`Screenshot saved: ${outputPath}`);

      // Close browser if configured
      if (this.popupConfig.closeAfterCapture) {
        Logger.info('Closing browser...');
        await browser.close();
      } else {
        Logger.info('Browser left open (closeAfterCapture: false)');
      }
    } catch (error) {
      Logger.error(`Error during popup capture: ${error.message}`);
      if (browser) {
        await browser.close();
      }
      throw error;
    }
  }

  /**
   * Execute screenshot_agent.exe to capture active window
   * @param {string} outputPath - Path to save screenshot
   */
  async executeScreenshotAgent(outputPath) {
    const agentPath = path.resolve(
      this.popupConfig.screenshotAgentPath || './screenshot_agent.exe'
    );

    // Check if screenshot agent exists
    if (!fs.existsSync(agentPath)) {
      throw new Error(`Screenshot agent not found: ${agentPath}`);
    }

    // Execute screenshot agent
    const command = `"${agentPath}" "${outputPath}"`;
    Logger.debug(`Executing: ${command}`);

    try {
      const { stdout, stderr } = await execAsync(command);
      if (stdout) Logger.debug(`stdout: ${stdout}`);
      if (stderr) Logger.debug(`stderr: ${stderr}`);
    } catch (error) {
      throw new Error(`Screenshot agent failed: ${error.message}`);
    }
  }

  /**
   * Generate output path for screenshot
   * @param {string} outputDir - Output directory
   * @returns {string} Full path for screenshot file
   */
  generateOutputPath(outputDir) {
    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '')
      .replace('T', '_');
    const filename = `popup_${timestamp}.png`;
    return path.join(outputDir, filename);
  }
}

export default PopupScreenshotCapture;
