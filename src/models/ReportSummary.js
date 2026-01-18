/**
 * Aggregated test execution summary
 */
class ReportSummary {
  constructor() {
    this.totalTests = 0;
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
    this.executionStartTime = null;
    this.executionEndTime = null;
    this.totalDuration = 0;
    this.browserInfo = {
      type: '',
      version: '',
      headless: false,
    };
    this.environment = {
      os: process.platform,
      nodeVersion: process.version,
    };
  }

  /**
   * Calculate summary from test reports
   */
  static fromTestReports(testReports, config) {
    const summary = new ReportSummary();

    // Flatten all tests (including children)
    const allTests = [];
    const flattenTests = test => {
      allTests.push(test);
      test.children.forEach(child => flattenTests(child));
    };

    testReports.forEach(test => flattenTests(test));

    // Calculate statistics
    summary.totalTests = allTests.length;
    summary.passed = allTests.filter(t => t.status === 'PASS').length;
    summary.failed = allTests.filter(t => t.status === 'FAIL').length;
    summary.skipped = allTests.filter(t => t.status === 'SKIP').length;

    // Get time range
    const startTimes = allTests.map(t => t.startTime).filter(t => t);
    const endTimes = allTests.map(t => t.endTime).filter(t => t);

    if (startTimes.length > 0) {
      summary.executionStartTime = new Date(Math.min(...startTimes.map(t => t.getTime())));
    }

    if (endTimes.length > 0) {
      summary.executionEndTime = new Date(Math.max(...endTimes.map(t => t.getTime())));
    }

    if (summary.executionStartTime && summary.executionEndTime) {
      summary.totalDuration = summary.executionEndTime - summary.executionStartTime;
    }

    // Browser info from config
    if (config && config.browser) {
      summary.browserInfo.type = config.browser.type || 'unknown';
      summary.browserInfo.headless = config.browser.headless || false;
    }

    return summary;
  }

  /**
   * Format duration as human-readable string
   */
  getFormattedDuration() {
    const seconds = Math.floor(this.totalDuration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes.toString().padStart(2, '0')}m ${remainingSeconds.toString().padStart(2, '0')}s`;
    }
    return `${remainingSeconds}s`;
  }

  /**
   * Convert to JSON for report
   */
  toJSON() {
    return {
      totalTests: this.totalTests,
      passed: this.passed,
      failed: this.failed,
      skipped: this.skipped,
      executionStartTime: this.executionStartTime ? this.executionStartTime.toISOString() : null,
      executionEndTime: this.executionEndTime ? this.executionEndTime.toISOString() : null,
      totalDuration: this.totalDuration,
      formattedDuration: this.getFormattedDuration(),
      browserInfo: this.browserInfo,
      environment: this.environment,
    };
  }
}

export default ReportSummary;
