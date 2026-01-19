import ConfigLoader from './src/utils/ConfigLoader.js';
import TestExecutor from './src/core/TestExecutor.js';
import PopupScreenshotCapture from './src/utils/PopupScreenshotCapture.js';
import Logger from './src/utils/Logger.js';

/**
 * Main entry point for test execution
 */
async function main() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('  AUTOMATION TEST FRAMEWORK v2.0');
    console.log('  Professional HTML Reporting');
    console.log('='.repeat(70) + '\n');

    // Load configuration
    const config = ConfigLoader.load('./config.yaml');

    // Check for popup screenshot mode
    const isPopupMode = process.argv.includes('--popup');
    const testFile = process.argv.find(arg => arg.endsWith('.yaml')) || './tests/sample-test.yaml';

    if (isPopupMode) {
      Logger.info('🖼️  POPUP SCREENSHOT MODE');
      Logger.info(`Test file: ${testFile}`);

      const popupCapture = new PopupScreenshotCapture(config);
      await popupCapture.captureFromTestFile(testFile);

      Logger.success('\n✓ Popup screenshot captured successfully!');
    } else {
      // Normal test execution
      const executor = new TestExecutor(config);
      Logger.info(`Running test file: ${testFile}`);

      await executor.run(testFile);

      Logger.success('\n✓ Test execution completed successfully!');
    }

    process.exit(0);
  } catch (error) {
    Logger.error(`\n✗ Execution failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run
main();
