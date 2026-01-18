/**
 * Step-level execution data model
 */
class StepReport {
  constructor(phase, actionType, selector = '', value = '') {
    this.phase = phase; // FILL, SUBMIT, ASSERT
    this.actionType = actionType; // input, click, dialog, assertion
    this.selector = selector;
    this.value = this.maskSensitiveValue(value);
    this.status = 'PENDING'; // PENDING, PASS, FAIL, SKIP
    this.executionTimeMs = 0;
    this.screenshotPath = null;
    this.errorMessage = null;
    this.stackTrace = null;
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Mask sensitive values (passwords, tokens, etc.)
   */
  maskSensitiveValue(value) {
    if (!value) return value;

    const valueStr = String(value);
    // Mask if it looks like a password or contains sensitive keywords
    const sensitiveKeywords = ['password', 'token', 'secret', 'key', 'credential'];
    const lowerValue = valueStr.toLowerCase();

    if (sensitiveKeywords.some(keyword => lowerValue.includes(keyword))) {
      return '****';
    }

    return valueStr;
  }

  /**
   * Start timing this step
   */
  start() {
    this.startTime = Date.now();
    this.status = 'RUNNING';
  }

  /**
   * Mark step as completed successfully
   */
  pass() {
    this.endTime = Date.now();
    this.executionTimeMs = this.endTime - this.startTime;
    this.status = 'PASS';
  }

  /**
   * Mark step as failed
   */
  fail(error) {
    this.endTime = Date.now();
    this.executionTimeMs = this.endTime - this.startTime;
    this.status = 'FAIL';
    this.errorMessage = error.message || String(error);
    this.stackTrace = error.stack || null;
  }

  /**
   * Skip this step
   */
  skip(reason = '') {
    this.status = 'SKIP';
    this.errorMessage = reason;
  }

  /**
   * Attach screenshot to this step
   */
  attachScreenshot(path) {
    this.screenshotPath = path;
  }

  /**
   * Convert to JSON for report
   */
  toJSON() {
    return {
      phase: this.phase,
      actionType: this.actionType,
      selector: this.selector,
      value: this.value,
      status: this.status,
      executionTimeMs: this.executionTimeMs,
      screenshotPath: this.screenshotPath,
      errorMessage: this.errorMessage,
      stackTrace: this.stackTrace,
    };
  }
}

export default StepReport;
