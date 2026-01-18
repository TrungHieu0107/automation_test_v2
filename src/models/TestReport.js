/**
 * Test-level execution data model
 */
class TestReport {
  constructor(testName, parentTest = null) {
    this.testName = testName;
    this.parentTest = parentTest;
    this.status = 'PENDING'; // PENDING, RUNNING, PASS, FAIL, SKIP
    this.startTime = null;
    this.endTime = null;
    this.duration = 0;
    this.steps = [];
    this.children = [];
    this.errorMessage = null;
    this.stackTrace = null;
  }

  /**
   * Start test execution
   */
  start() {
    this.startTime = new Date();
    this.status = 'RUNNING';
  }

  /**
   * Mark test as completed
   */
  complete() {
    this.endTime = new Date();
    this.duration = this.endTime - this.startTime;

    // Determine final status based on steps and children
    const hasFailedSteps = this.steps.some(step => step.status === 'FAIL');
    const hasFailedChildren = this.children.some(child => child.status === 'FAIL');

    if (hasFailedSteps || hasFailedChildren) {
      this.status = 'FAIL';
    } else if (this.status === 'RUNNING') {
      this.status = 'PASS';
    }
  }

  /**
   * Mark test as failed
   */
  fail(error) {
    this.endTime = new Date();
    this.duration = this.endTime - this.startTime;
    this.status = 'FAIL';
    this.errorMessage = error.message || String(error);
    this.stackTrace = error.stack || null;
  }

  /**
   * Skip this test
   */
  skip(reason = '') {
    this.status = 'SKIP';
    this.errorMessage = reason;
  }

  /**
   * Add a step to this test
   */
  addStep(step) {
    this.steps.push(step);
    return step;
  }

  /**
   * Add a child test
   */
  addChild(childTest) {
    this.children.push(childTest);
    return childTest;
  }

  /**
   * Get all steps grouped by phase
   */
  getStepsByPhase() {
    const grouped = {
      FILL: [],
      SUBMIT: [],
      ASSERT: [],
    };

    this.steps.forEach(step => {
      if (grouped[step.phase]) {
        grouped[step.phase].push(step);
      }
    });

    return grouped;
  }

  /**
   * Convert to JSON for report
   */
  toJSON() {
    return {
      testName: this.testName,
      parentTest: this.parentTest,
      status: this.status,
      startTime: this.startTime ? this.startTime.toISOString() : null,
      endTime: this.endTime ? this.endTime.toISOString() : null,
      duration: this.duration,
      steps: this.steps.map(step => step.toJSON()),
      children: this.children.map(child => child.toJSON()),
      errorMessage: this.errorMessage,
      stackTrace: this.stackTrace,
    };
  }
}

export default TestReport;
