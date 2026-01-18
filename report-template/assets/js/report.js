/**
 * Test Report Interactive JavaScript
 */

// Initialize report on load
document.addEventListener('DOMContentLoaded', () => {
  if (window.REPORT_DATA) {
    initializeReport(window.REPORT_DATA);
  } else {
    console.error('No report data found');
  }
});

/**
 * Initialize the report
 */
function initializeReport(data) {
  renderDashboard(data.summary);
  renderHeaderMeta(data.summary);
  renderTestTree(data.tests);
  initializeModal();
  scrollToFirstFailure();
}

/**
 * Render dashboard summary
 */
function renderDashboard(summary) {
  document.getElementById('stat-total').textContent = summary.totalTests;
  document.getElementById('stat-passed').textContent = summary.passed;
  document.getElementById('stat-failed').textContent = summary.failed;
  document.getElementById('stat-skipped').textContent = summary.skipped;
  document.getElementById('stat-duration').textContent = summary.formattedDuration;
  
  const browserName = summary.browserInfo.type.toUpperCase();
  const browserMode = summary.browserInfo.headless ? ' (Headless)' : '';
  document.getElementById('stat-browser').textContent = browserName + browserMode;
}

/**
 * Render header metadata
 */
function renderHeaderMeta(summary) {
  const startTime = new Date(summary.executionStartTime).toLocaleString();
  const endTime = new Date(summary.executionEndTime).toLocaleString();
  
  const metaHtml = `
    <div>
      <strong>Started:</strong> ${startTime}<br>
      <strong>Completed:</strong> ${endTime}
    </div>
  `;
  
  document.getElementById('header-meta').innerHTML = metaHtml;
}

/**
 * Render test tree
 */
function renderTestTree(tests) {
  const treeContainer = document.getElementById('test-tree');
  treeContainer.innerHTML = '';
  
  tests.forEach(test => {
    const testElement = createTestElement(test);
    treeContainer.appendChild(testElement);
  });
}

/**
 * Create test element
 */
function createTestElement(test, isChild = false) {
  const testItem = document.createElement('div');
  testItem.className = 'test-item';
  testItem.dataset.status = test.status;
  
  // Header
  const header = document.createElement('div');
  header.className = 'test-header';
  
  const hasContent = test.steps.length > 0 || test.children.length > 0;
  
  header.innerHTML = `
    ${hasContent ? '<div class="test-toggle">▶</div>' : '<div class="test-toggle"></div>'}
    <div class="test-status">${getStatusIcon(test.status)}</div>
    <div class="test-name">${test.testName}</div>
    <div class="test-duration">${formatDuration(test.duration)}</div>
  `;
  
  testItem.appendChild(header);
  
  // Body
  if (hasContent) {
    const body = document.createElement('div');
    body.className = 'test-body';
    
    // Steps
    if (test.steps.length > 0) {
      const stepsSection = createStepsSection(test.steps);
      body.appendChild(stepsSection);
    }
    
    // Error
    if (test.errorMessage) {
      const errorSection = createErrorSection(test.errorMessage, test.stackTrace);
      body.appendChild(errorSection);
    }
    
    // Children
    if (test.children.length > 0) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'test-children';
      
      test.children.forEach(child => {
        const childElement = createTestElement(child, true);
        childrenContainer.appendChild(childElement);
      });
      
      body.appendChild(childrenContainer);
    }
    
    testItem.appendChild(body);
    
    // Toggle functionality
    header.addEventListener('click', () => {
      testItem.classList.toggle('expanded');
    });
  }
  
  return testItem;
}

/**
 * Create steps section
 */
function createStepsSection(steps) {
  const section = document.createElement('div');
  section.className = 'steps-section';
  
  // Group by phase
  const phases = { FILL: [], SUBMIT: [], ASSERT: [] };
  steps.forEach(step => {
    if (phases[step.phase]) {
      phases[step.phase].push(step);
    }
  });
  
  // Render each phase
  Object.keys(phases).forEach(phase => {
    if (phases[phase].length > 0) {
      const phaseTitle = document.createElement('div');
      phaseTitle.className = 'phase-title';
      phaseTitle.textContent = `${phase} Phase`;
      section.appendChild(phaseTitle);
      
      const stepList = document.createElement('div');
      stepList.className = 'step-list';
      
      phases[phase].forEach((step, index) => {
        const stepElement = createStepElement(step, index);
        stepList.appendChild(stepElement);
      });
      
      section.appendChild(stepList);
    }
  });
  
  return section;
}

/**
 * Create step element
 */
function createStepElement(step, index) {
  const stepItem = document.createElement('div');
  stepItem.className = `step-item status-${step.status.toLowerCase()}`;
  
  let detailsHtml = `
    <div class="step-icon">${getStatusIcon(step.status)}</div>
    <div class="step-details">
      <div class="step-action">
        <strong>#${index + 1}</strong> ${step.actionType}
        ${step.selector ? `<span class="step-selector">${step.selector}</span>` : ''}
      </div>
  `;
  
  if (step.value) {
    detailsHtml += `<div class="step-value">Value: ${step.value}</div>`;
  }
  
  if (step.errorMessage) {
    detailsHtml += `<div class="step-value" style="color: var(--status-fail);">Error: ${step.errorMessage}</div>`;
  }
  
  if (step.screenshotPath) {
    detailsHtml += `
      <div class="step-screenshot">
        <img src="${step.screenshotPath}" 
             alt="Screenshot" 
             class="screenshot-thumb"
             onclick="openScreenshotModal('${step.screenshotPath}', 'Step ${index + 1}')">
      </div>
    `;
  }
  
  detailsHtml += `
    </div>
    <div class="step-time">${step.executionTimeMs}ms</div>
  `;
  
  stepItem.innerHTML = detailsHtml;
  
  return stepItem;
}

/**
 * Create error section
 */
function createErrorSection(errorMessage, stackTrace) {
  const section = document.createElement('div');
  section.className = 'error-section';
  
  let html = `
    <div class="error-title">❌ Error</div>
    <div class="error-message">${errorMessage}</div>
  `;
  
  if (stackTrace) {
    const traceId = 'trace-' + Math.random().toString(36).substr(2, 9);
    html += `
      <button class="stack-toggle" onclick="toggleStackTrace('${traceId}')">
        Show Stack Trace
      </button>
      <pre class="stack-trace hidden" id="${traceId}">${stackTrace}</pre>
    `;
  }
  
  section.innerHTML = html;
  return section;
}

/**
 * Toggle stack trace visibility
 */
function toggleStackTrace(id) {
  const trace = document.getElementById(id);
  const button = trace.previousElementSibling;
  
  if (trace.classList.contains('hidden')) {
    trace.classList.remove('hidden');
    button.textContent = 'Hide Stack Trace';
  } else {
    trace.classList.add('hidden');
    button.textContent = 'Show Stack Trace';
  }
}

/**
 * Get status icon
 */
function getStatusIcon(status) {
  const icons = {
    'PASS': '✅',
    'FAIL': '❌',
    'SKIP': '⏸',
    'PENDING': '⏳',
    'RUNNING': '▶️'
  };
  return icons[status] || '❓';
}

/**
 * Format duration
 */
function formatDuration(ms) {
  if (!ms) return '0ms';
  
  const seconds = Math.floor(ms / 1000);
  const milliseconds = ms % 1000;
  
  if (seconds > 0) {
    return `${seconds}s ${milliseconds}ms`;
  }
  return `${milliseconds}ms`;
}

/**
 * Initialize screenshot modal
 */
function initializeModal() {
  const modal = document.getElementById('screenshot-modal');
  const modalClose = document.getElementById('modal-close');
  const overlay = modal.querySelector('.modal-overlay');
  
  const closeModal = () => {
    modal.classList.remove('active');
  };
  
  modalClose.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

/**
 * Open screenshot modal
 */
function openScreenshotModal(imagePath, caption) {
  const modal = document.getElementById('screenshot-modal');
  const modalImage = document.getElementById('modal-image');
  const modalCaption = document.getElementById('modal-caption');
  
  modalImage.src = imagePath;
  modalCaption.textContent = caption;
  modal.classList.add('active');
}

/**
 * Scroll to first failure
 */
function scrollToFirstFailure() {
  setTimeout(() => {
    const failedTest = document.querySelector('.test-item[data-status="FAIL"]');
    if (failedTest) {
      failedTest.scrollIntoView({ behavior: 'smooth', block: 'center' });
      failedTest.classList.add('expanded');
    }
  }, 500);
}
