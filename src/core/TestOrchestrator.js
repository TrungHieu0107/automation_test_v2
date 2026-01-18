import Logger from '../utils/Logger.js';
import { ExecutionContext } from './ExecutionContextStack.js';

/**
 * Orchestrates parent-child test execution
 */
class TestOrchestrator {
  constructor(config, contextStack) {
    this.config = config;
    this.contextStack = contextStack;
  }

  /**
   * Execute parent test with its children
   */
  async executeParentWithChildren(testData, testReport, executor, fileLoader) {
    // Execute parent test first (children will be handled separately)
    // Note: We modify the testData temporarily to remove children so
    // executeTestInternal doesn't try to handle them
    const originalChildren = testData.children;
    testData.children = []; // Temporarily remove children

    await executor.executeTestInternal(testData, testReport);

    // Restore children for processing
    testData.children = originalChildren;

    // Check if parent passed before executing children
    if (!this.shouldExecuteChildren(testReport.status)) {
      Logger.warn(`Parent test failed, skipping ${testData.children?.length || 0} child tests`);

      // Mark children as skipped in report
      if (testData.children) {
        for (const childRef of testData.children) {
          const skippedChild = executor.reportManager.createTestReport(
            childRef.path || 'Unknown Child',
            testData.name
          );
          skippedChild.skip('Parent test failed');
          testReport.addChild(skippedChild);
        }
      }
      return;
    }

    // Execute child tests if parent succeeded
    if (testData.children && testData.children.length > 0) {
      Logger.info(`\n--- EXECUTING CHILD TESTS (${testData.children.length}) ---`);

      // Capture parent context
      const parentContext = await this.captureContext(executor.page, testData.name);
      this.contextStack.push(parentContext);

      try {
        for (let i = 0; i < testData.children.length; i++) {
          const childRef = testData.children[i];

          try {
            await this.executeChildTest(childRef, testReport, executor, fileLoader, testData);

            // Optionally restore parent context between children
            if (this.shouldRestoreBrowserState() && i < testData.children.length - 1) {
              await this.restoreContext(executor.page, parentContext);
            }
          } catch (error) {
            Logger.error(`Child test execution failed: ${error.message}`);

            // Check if we should continue or stop
            if (this.shouldStopOnChildFailure()) {
              Logger.warn('Stopping child test execution due to failure');

              // Mark remaining children as skipped
              for (let j = i + 1; j < testData.children.length; j++) {
                const skippedChildRef = testData.children[j];
                const skippedChild = executor.reportManager.createTestReport(
                  skippedChildRef.path || 'Unknown Child',
                  testData.name
                );
                skippedChild.skip('Previous child test failed');
                testReport.addChild(skippedChild);
              }
              break;
            }
          }
        }
      } finally {
        this.contextStack.pop();
      }
    }
  }

  /**
   * Execute a single child test
   */
  async executeChildTest(childRef, parentReport, executor, fileLoader, parentTestData) {
    // Load child test file (resolve relative to parent's source file)
    const childTestData = await fileLoader.loadTestFile(childRef.path, parentTestData._sourceFile);

    Logger.info(`\n${'='.repeat(60)}`);
    Logger.info(`Executing child test: ${childTestData.name}`);
    Logger.info(`Source: ${childRef.path}`);
    Logger.info(`Reusing browser state from parent`);
    Logger.info('='.repeat(60));

    // Create child test report
    const childReport = executor.reportManager.createTestReport(
      childTestData.name,
      parentReport.testName
    );

    // Execute child test (reuses browser state)
    await executor.executeTestInternal(childTestData, childReport);

    // Add to parent report
    parentReport.addChild(childReport);

    Logger.info(`Child test completed: ${childTestData.name} [${childReport.status}]`);
  }

  /**
   * Determine if children should execute based on parent status
   */
  shouldExecuteChildren(parentStatus) {
    return parentStatus === 'PASS';
  }

  /**
   * Check if execution should stop on child failure
   */
  shouldStopOnChildFailure() {
    return this.config.testExecution?.stopOnChildFailure === true;
  }

  /**
   * Check if browser state should be restored between children
   */
  shouldRestoreBrowserState() {
    return this.config.testExecution?.restoreBrowserState !== false;
  }

  /**
   * Capture current browser context
   */
  async captureContext(page, testName) {
    const context = new ExecutionContext(testName, page.url());
    Logger.info(`Captured context: ${testName} @ ${page.url()}`);
    return context;
  }

  /**
   * Restore browser context
   */
  async restoreContext(page, context) {
    const currentUrl = page.url();

    if (currentUrl !== context.url) {
      Logger.info(`Restoring context: navigating to ${context.url}`);
      await page.goto(context.url, { waitUntil: 'networkidle' });
    } else {
      Logger.info(`Context already at correct URL: ${context.url}`);
    }
  }
}

export default TestOrchestrator;
