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
          // Attempt to capture screenshot with dialog visible (if requested)
          // Dialog is OS-level, so we need active window capture
          if (nextAction.capture) {
            Logger.debug('Attempting to capture active window screenshot with visible dialog...');

            try {
              // Longer delay to ensure dialog is fully rendered and visible
              await new Promise(resolve => setTimeout(resolve, 300));

              // Dynamic imports for ES modules
              const { default: path } = await import('path');
              const { default: fs } = await import('fs-extra');

              // Save screenshot
              const filename = this.screenshotManager.generateFilename(
                nextAction.testName,
                'DIALOG',
                nextAction.stepIndex
              );
              const filepath = path.join(this.screenshotManager.screenshotsDir, filename);

              // Use platform-specific active window capture
              if (process.platform === 'win32') {
                // Windows: Use PowerShell to capture active window only
                await this.captureActiveWindowWindows(filepath);
              } else if (process.platform === 'darwin') {
                // macOS: Use screencapture -w for active window
                const { exec } = await import('child_process');
                const { promisify } = await import('util');
                const execAsync = promisify(exec);
                await execAsync(`screencapture -w "${filepath}"`);
              } else {
                // Linux/Other: Fall back to full screen
                const { default: screenshot } = await import('screenshot-desktop');
                const img = await screenshot({ format: 'png' });
                await fs.writeFile(filepath, img);
              }

              if (nextAction.step) {
                nextAction.step.attachScreenshot(`screenshots/${filename}`);
              }

              Logger.debug(`Dialog screenshot captured: ${filename}`);
            } catch (screenshotError) {
              // Screenshot failed - continue with dialog handling
              Logger.warn(`Dialog screenshot failed: ${screenshotError.message}`);
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
   * Capture active window on Windows using PowerShell
   */
  async captureActiveWindowWindows(filepath) {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const { default: os } = await import('os');
    const { default: path } = await import('path');
    const { default: fs } = await import('fs-extra');
    const execAsync = promisify(exec);

    // Create temp PowerShell script file
    const tempDir = os.tmpdir();
    const scriptPath = path.join(tempDir, `screenshot_${Date.now()}.ps1`);

    // Normalize filepath for PowerShell (escape backslashes)
    const escapedPath = filepath.replace(/\\/g, '\\\\');

    // PowerShell script content
    const psScript = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

Add-Type @"
using System;
using System.Runtime.InteropServices;
public struct RECT {
  public int Left;
  public int Top;
  public int Right;
  public int Bottom;
}
public class Win32 {
  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")]
  public static extern bool GetWindowRect(IntPtr hWnd, ref RECT rect);
}
"@

try {
  $handle = [Win32]::GetForegroundWindow()
  $rect = New-Object RECT
  [Win32]::GetWindowRect($handle, [ref]$rect) | Out-Null
  $width = $rect.Right - $rect.Left
  $height = $rect.Bottom - $rect.Top
  
  if ($width -gt 0 -and $height -gt 0) {
    $bitmap = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bitmap.Size)
    $bitmap.Save("${escapedPath}", [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
  } else {
    exit 1
  }
} catch {
  exit 1
}
`;

    try {
      // Write script to temp file
      await fs.writeFile(scriptPath, psScript, 'utf8');

      // Execute PowerShell script
      await execAsync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`);

      // Clean up temp file
      await fs.unlink(scriptPath).catch(() => {});

      // Verify screenshot was created
      if (!(await fs.pathExists(filepath))) {
        throw new Error('Screenshot file was not created');
      }
    } catch (error) {
      // Clean up temp file on error
      await fs.unlink(scriptPath).catch(() => {});
      throw error;
    }
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
