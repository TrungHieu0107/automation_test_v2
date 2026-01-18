import TestReport from '../models/TestReport.js';
import Logger from '../utils/Logger.js';

/**
 * Report Manager - Central orchestrator for report generation
 */
class ReportManager {
  constructor(config) {
    this.config = config;
    this.testReports = [];
    this.currentTest = null;
  }

  /**
   * Create a new test report
   */
  createTestReport(testName, parentTest = null) {
    const testReport = new TestReport(testName, parentTest);
    
    if (!parentTest) {
      // Root level test
      this.testReports.push(testReport);
    }
    
    this.currentTest = testReport;
    return testReport;
  }

  /**
   * Get all test reports
   */
  getAllReports() {
    return this.testReports;
  }

  /**
   * Get current test
   */
  getCurrentTest() {
    return this.currentTest;
  }

  /**
   * Set current test
   */
  setCurrentTest(testReport) {
    this.currentTest = testReport;
  }

  /**
   * Check if reporting is enabled
   */
  isEnabled() {
    return this.config.report && this.config.report.enabled !== false;
  }

  /**
   * Get output directory
   */
  getOutputDir() {
    return this.config.report?.outputDir || 'report/';
  }

  /**
   * Should open report after execution
   */
  shouldOpenAfterExecution() {
    return this.config.report?.openAfterExecution !== false;
  }
}

export default ReportManager;
