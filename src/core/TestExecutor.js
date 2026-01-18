import { chromium, firefox, webkit } from 'playwright';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import Logger from '../utils/Logger.js';
import TestReport from '../models/TestReport.js';
import StepReport from '../models/StepReport.js';
import ActionHandler from '../actions/ActionHandler.js';
import ScreenshotManager from '../actions/ScreenshotManager.js';
import AssertionEngine from '../assertions/AssertionEngine.js';
import ReportManager from '../reporting/ReportManager.js';
import ReportAggregator from '../reporting/ReportAggregator.js';
import HtmlReportGenerator from '../reporting/HtmlReportGenerator.js';
import TestFileLoader from './TestFileLoader.js';
import TestOrchestrator from './TestOrchestrator.js';
import { ExecutionContextStack } from './ExecutionContextStack.js';

/**
 * Main test executor - orchestrates test execution and reporting
 */
class TestExecutor {
  constructor(config) {
    this.config = config;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.reportManager = new ReportManager(config);
    this.testFileLoader = new TestFileLoader();
    this.contextStack = new ExecutionContextStack();
    this.testOrchestrator = new TestOrchestrator(config, this.contextStack);
  }

  /**
   * Initialize browser
   */
  async initialize() {
    Logger.info('Initializing browser...');

    const browserType = this.config.browser?.type || 'msedge';
    const headless = this.config.browser?.headless || false;

    // Select browser
    let browserEngine;
    if (browserType === 'msedge' || browserType === 'chrome') {
      browserEngine = chromium;
    } else if (browserType === 'firefox') {
      browserEngine = firefox;
    } else if (browserType === 'webkit' || browserType === 'safari') {
      browserEngine = webkit;
    } else {
      browserEngine = chromium;
    }

    // Launch browser
    this.browser = await browserEngine.launch({
      headless,
      channel: browserType === 'msedge' ? 'msedge' : undefined,
    });

    // Create context
    this.context = await this.browser.newContext({
      viewport: this.config.browser?.viewport || { width: 1535, height: 1024 },
    });

    // Create page
    this.page = await this.context.newPage();

    Logger.success('Browser initialized');
  }

  /**
   * Load test from YAML file using TestFileLoader
   */
  async loadTest(testFilePath) {
    return await this.testFileLoader.loadTestFile(testFilePath);
  }

  /**
   * Execute a single test (public interface)
   * Determines if test has file-based children and uses orchestrator
   */
  async executeTest(testData, parentReport = null) {
    const testReport = this.reportManager.createTestReport(testData.name, parentReport?.testName);

    // Check if children are file references
    const hasFileReferences = testData.children?.some(child => child.path);

    if (hasFileReferences) {
      // Use orchestrator for file-based children
      // Orchestrator will execute parent and then children
      await this.testOrchestrator.executeParentWithChildren(
        testData,
        testReport,
        this,
        this.testFileLoader
      );
    } else {
      // No file-based children - execute normally
      await this.executeTestInternal(testData, testReport);

      // Handle inline children (backwards compatibility)
      if (testData.children && testData.children.length > 0) {
        Logger.info('\n--- CHILD TESTS (INLINE) ---');
        for (const childTest of testData.children) {
          const childReport = await this.executeTestInternal(childTest);
          testReport.addChild(childReport);
        }
      }
    }

    if (parentReport) {
      return testReport;
    }
  }

  /**
   * Execute test steps internally (without orchestration)
   * Used by orchestrator for both parent and child tests
   */
  async executeTestInternal(testData, testReport) {
    testReport.start();

    Logger.info(`\n${'='.repeat(60)}`);
    Logger.info(`Executing test: ${testData.name}`);
    Logger.info('='.repeat(60));

    // Initialize helpers
    const outputDir = this.reportManager.getOutputDir();
    const screenshotManager = new ScreenshotManager(outputDir, this.config);
    const actionHandler = new ActionHandler(this.page, screenshotManager);
    actionHandler.resetDialogQueue();
    actionHandler.startDialogListener();
    const assertionEngine = new AssertionEngine(this.page, screenshotManager);

    // Reset screenshot capture tracking for this test
    screenshotManager.resetCaptureTracking();

    try {
      let stepIndex = 0;

      // Navigate to URL if specified (only for parent tests)
      if (testData.url) {
        const navStep = await actionHandler.navigate(testData.url, testData.name, stepIndex++);
        testReport.addStep(navStep);

        if (navStep.status === 'FAIL') {
          throw new Error('Navigation failed');
        }
      }

      // NEW: Unified actions phase (combines fillData + submit)
      // Allows fill, click, dialog, waitForNavigation in any order
      if (testData.actions) {
        Logger.info('\n--- ACTIONS PHASE ---');

        // Use standard for-loop to allow look-ahead/skipping
        for (let i = 0; i < testData.actions.length; i++) {
          const action = testData.actions[i];
          const currentStepIndex = stepIndex; // Current base index

          // LOOK-ACTION: Dialog Handling
          // Check if upcoming actions are dialogs. If so, we must register handlers
          // BEFORE executing the current action (which likely triggers the dialog).
          const dialogSteps = [];
          let skipCount = 0;

          if (action.type !== 'dialog') {
            let j = i + 1;
            while (j < testData.actions.length && testData.actions[j].type === 'dialog') {
              const dialogAction = testData.actions[j];
              const dialogIndex = currentStepIndex + 1 + (j - (i + 1)); // current + 1 + offset

              // Register handler immediately
              const dStep = await actionHandler.handleDialog(
                dialogAction.action,
                testData.name,
                dialogIndex,
                dialogAction.capture
              );

              dialogSteps.push(dStep);
              skipCount++;
              j++;
            }
          }

          let step;
          const actionType = action.type || 'fill';
          const capture = action.capture || false;

          // EXECUTE CURRENT ACTION
          if (actionType === 'fill') {
            step = await actionHandler.fillInput(
              action.selector,
              action.value,
              testData.name,
              currentStepIndex
            );
          } else if (actionType === 'click') {
            step = await actionHandler.click(
              action.selector,
              testData.name,
              currentStepIndex,
              'ACTION'
            );
          } else if (actionType === 'dialog') {
            // Standard dialog execution (stand-alone)
            step = await actionHandler.handleDialog(action.action, testData.name, currentStepIndex);
          } else if (actionType === 'waitForNavigation') {
            step = await actionHandler.waitForNavigation(
              testData.name,
              currentStepIndex,
              action.timeout
            );
          } else {
            throw new Error(`Unsupported action type: ${actionType}`);
          }

          // Capture for current action
          if (capture) {
            const screenshot = await screenshotManager.capture(
              this.page,
              testData.name,
              actionType,
              currentStepIndex
            );
            if (screenshot) {
              step.attachScreenshot(screenshot);
            }
          }

          testReport.addStep(step);

          // Add pre-registered dialog steps to report
          for (const dStep of dialogSteps) {
            testReport.addStep(dStep);
          }

          if (step.status === 'FAIL') {
            throw new Error(`Action failed: ${actionType} at ${action.selector || 'dialog'}`);
          }

          // Advance index and loop counter
          stepIndex += 1 + skipCount;
          i += skipCount;
        }
      }

      // Execute fill data phase (legacy - for backward compatibility)
      if (testData.fillData) {
        Logger.info('\n--- FILL DATA PHASE ---');
        for (const action of testData.fillData) {
          const step = await actionHandler.fillInput(
            action.selector,
            action.value,
            testData.name,
            stepIndex++
          );
          testReport.addStep(step);

          if (step.status === 'FAIL') {
            throw new Error(`Fill data failed at ${action.selector}`);
          }
        }
      }

      // Execute assertions
      if (testData.assertions) {
        // Capture screenshot before assertions (User Request)
        const preAssertStep = new StepReport(
          'ASSERT',
          'screenshot',
          'page',
          'pre-assertion snapshot'
        );
        preAssertStep.start();
        const s = await screenshotManager.capture(
          this.page,
          testData.name,
          'pre_assertion',
          stepIndex++
        );
        if (s) preAssertStep.attachScreenshot(s);
        preAssertStep.pass();
        testReport.addStep(preAssertStep);

        Logger.info('\n--- ASSERTION PHASE ---');
        for (const assertion of testData.assertions) {
          let step;

          if (assertion.type === 'text') {
            // Support both 'expected' and 'expectedText' fields
            const expectedText = assertion.expected || assertion.expectedText;
            const operator = assertion.operator || 'equals';

            step = await assertionEngine.assertText(
              assertion.selector,
              expectedText,
              testData.name,
              stepIndex++,
              operator,
              assertion.timeout
            );
          } else if (assertion.type === 'visibility') {
            // Check if element is visible or hidden
            const expectedState = assertion.expected || 'visible';
            step = await assertionEngine.assertVisibility(
              assertion.selector,
              expectedState,
              testData.name,
              stepIndex++,
              assertion.timeout
            );
          } else if (assertion.type === 'exists') {
            step = await assertionEngine.assertExists(
              assertion.selector,
              testData.name,
              stepIndex++,
              assertion.timeout
            );
          } else if (assertion.type === 'urlContains') {
            step = await assertionEngine.assertUrlContains(
              assertion.expectedUrl,
              testData.name,
              stepIndex++,
              assertion.timeout
            );
          }

          if (step) {
            testReport.addStep(step);

            if (step.status === 'FAIL') {
              throw new Error(`Assertion failed: ${step.errorMessage}`);
            }
          }
        }
      }

      // Note: Children are NOT executed here - orchestrator handles them

      testReport.complete();
      Logger.success(`✓ Test completed: ${testData.name} [${testReport.status}]`);
    } catch (error) {
      Logger.error(`✗ Test failed: ${testData.name}`);
      Logger.error(error.message);
      testReport.fail(error);
    }

    return testReport;
  }

  /**
   * Execute all tests and generate report
   */
  async run(testFilePath) {
    try {
      await this.initialize();

      const testData = await this.loadTest(testFilePath);

      // Execute test (can be parent with children)
      await this.executeTest(testData);

      // Generate report if enabled
      if (this.reportManager.isEnabled()) {
        await this.generateReport();
      }
    } catch (error) {
      Logger.error(`Execution failed: ${error.message}`);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Generate HTML report
   */
  async generateReport() {
    try {
      Logger.info('\n' + '='.repeat(60));
      Logger.info('GENERATING REPORT');
      Logger.info('='.repeat(60));

      const outputDir = this.reportManager.getOutputDir();

      // Aggregate data
      const aggregator = new ReportAggregator(this.config);
      const reportData = aggregator.aggregate(this.reportManager.getAllReports());

      // Display statistics
      const stats = aggregator.getStatistics(reportData);
      Logger.info(`Total Tests: ${stats.total}`);
      Logger.success(`✓ Passed: ${stats.passed}`);
      if (stats.failed > 0) {
        Logger.error(`✗ Failed: ${stats.failed}`);
      }
      if (stats.skipped > 0) {
        Logger.warn(`⏸ Skipped: ${stats.skipped}`);
      }
      Logger.info(`Duration: ${stats.duration}`);

      // Generate HTML
      const generator = new HtmlReportGenerator(outputDir);
      const reportPath = await generator.generate(reportData);

      // Open in browser if configured
      if (this.reportManager.shouldOpenAfterExecution()) {
        await generator.openInBrowser(reportPath);
      }

      Logger.info('='.repeat(60));
    } catch (error) {
      Logger.error(`Report generation failed: ${error.message}`);
      // Don't throw - report generation should not crash test execution
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      Logger.info('Browser closed');
    }
  }
}

export default TestExecutor;
