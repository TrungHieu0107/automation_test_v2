import ReportSummary from '../models/ReportSummary.js';
import Logger from '../utils/Logger.js';

/**
 * Aggregates execution data for report generation
 */
class ReportAggregator {
  constructor(config) {
    this.config = config;
  }

  /**
   * Aggregate test reports into report data
   */
  aggregate(testReports) {
    Logger.info('Aggregating test execution data...');
    
    const summary = ReportSummary.fromTestReports(testReports, this.config);
    
    const reportData = {
      summary: summary.toJSON(),
      tests: testReports.map(test => test.toJSON()),
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    
    Logger.success('Test data aggregated successfully');
    return reportData;
  }

  /**
   * Get statistics from report data
   */
  getStatistics(reportData) {
    return {
      total: reportData.summary.totalTests,
      passed: reportData.summary.passed,
      failed: reportData.summary.failed,
      skipped: reportData.summary.skipped,
      duration: reportData.summary.formattedDuration
    };
  }
}

export default ReportAggregator;
