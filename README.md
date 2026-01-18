# YAML-Driven Web Automation Framework

> **Professional test automation framework with enterprise-grade HTML reporting**

## Overview

A modern, YAML-driven web automation testing framework built on Playwright, designed for enterprise QA teams. Define complex multi-step test scenarios using simple YAML syntax, capture detailed execution reports with screenshots, and organize tests with parent-child composition for maximum reusability and maintainability.

### Key Purpose

This framework enables:

- **Declarative Testing**: Write tests in clean YAML without coding
- **Unified Actions Architecture**: Mix fill, click, dialog, and navigation actions in a single sequential flow
- **Visual Documentation**: Automatic screenshot capture at critical test points
- **Professional Reporting**: Enterprise-grade HTML reports with glassmorphism UI and dark theme
- **Modular Test Design**: File-based test composition with parent-child relationships
- **Multi-Browser Support**: Run tests on Edge, Chrome, Firefox, and Safari via Playwright

## Features

- ✅ **YAML-Driven Tests** - Define tests using simple YAML syntax
- ✅ **Unified Actions Phase** - Sequential execution of fill, click, dialog, and navigation in one flow
- ✅ **File-Based Test Composition** - Modular test organization with parent-child file references
- ✅ **Flexible Selectors** - Support for id, name, css, xpath selector strategies
- ✅ **Multi-Element Support** - input, textarea, select, checkbox, radio buttons
- ✅ **Rich Assertions** - textContent, inputValue, visibility, enabled, style with operators
- ✅ **Smart Screenshot Capture** - Fine-grained control with automatic fallback and dialog capture
- ✅ **Professional HTML Reports** - Modern UI with glassmorphism and dark theme
- ✅ **Browser State Preservation** - No restarts between parent and child tests
- ✅ **Hierarchical Test Visualization** - Clear parent→child relationships in reports
- ✅ **Multiple Browser Support** - Edge, Chrome, Firefox, Safari (via Playwright)
- ✅ **Configurable Execution** - Control failure behavior and state restoration
- ✅ **Circular Dependency Detection** - Prevents infinite test loops
- ✅ **SOLID Principles** - Extensible architecture with Strategy and Factory patterns

## Installation

```bash
npm install
```

## Usage

### Run Tests

```bash
# Run test with default browser
npm test

# Run specific test file
node index.js tests/your-test.yaml
```

### Test Structure

#### Modern Test with Unified Actions Phase

```yaml
name: Create Denpyo
description: Create a new denpyo entry with product information
url: http://example.com/form

# ACTIONS PHASE - Sequential execution of all actions
actions:
  # Fill initial fields
  - type: fill
    selector: '[name="username"]'
    value: 'admin'
    capture: true # Optional: capture screenshot after this step

  # Click button
  - type: click
    selector: '[name="search"]'

  # Wait for search results
  - type: waitForNavigation
    timeout: 3000

  # Fill fields after navigation (dynamic form)
  - type: fill
    selector: '[name="product_code"]'
    value: '12345'
    capture: true

  # Click confirm button
  - type: click
    selector: '[name="confirm"]'
    capture: true

  # Handle confirmation dialog
  - type: dialog
    action: accept # or 'dismiss'
    capture: true # Captures screenshot of dialog

  # Wait after dialog
  - type: waitForNavigation
    timeout: 2000

# ASSERTIONS - Verify success
assertions:
  - type: exists
    selector: '.success-message'
    timeout: 5000

# CHILDREN - Execute after parent completes
children:
  - path: children/update-profile.yaml
  - path: children/logout.yaml
```

#### Child Test (reuses parent browser state)

```yaml
name: Update Profile

# ACTIONS PHASE
actions:
  # Fill fields with explicit selector strategy
  - type: fill
    selector:
      by: name
      value: 'profileName'
    value: 'John Doe'
    capture: true # Optional: capture screenshot after this step

  # Legacy format also supported (CSS selector)
  - type: fill
    selector: '#email'
    value: 'john@example.com'
    capture: true

  # Click save button
  - type: click
    selector: '#saveBtn'

# ASSERTIONS - Rich assertion capabilities
assertions:
  # Text content with operators
  - type: textContent
    selector: '.success'
    expected: 'Profile updated'
    operator: contains

  # Visibility assertion
  - type: visibility
    selector: '.success'
    expected: visible
```

## Configuration

Edit `config.yaml` to customize:

```yaml
browser:
  type: msedge # msedge, chrome, firefox, webkit
  headless: false # Show browser window

report:
  enabled: true
  outputDir: report/
  openAfterExecution: true

screenshots:
  enabled: true
  onFailure: true
  # Per-step control via YAML (capture: true)
  # Automatic fallback before/after submit if no explicit captures

testExecution:
  stopOnChildFailure: false # Continue with next child if one fails
  restoreBrowserState: true # Navigate back to parent URL after each child
```

## Advanced Features

### Unified Actions Phase

The modern framework architecture uses a single `actions` phase for sequential execution of all test actions. This replaces the legacy `fillData` and `submit` phases with a more flexible approach.

**Supported Action Types:**

- `fill` - Fill input fields, textareas, selects, checkboxes
- `click` - Click buttons, links, or any element
- `dialog` - Handle browser dialogs (alert, confirm, prompt)
- `waitForNavigation` - Wait for page loads and navigation

**Benefits:**

- ✅ Sequential execution in defined order
- ✅ Mix action types freely (fill → click → dialog → wait)
- ✅ Better handling of dynamic forms (fill after search/navigation)
- ✅ Screenshot capture at any step with `capture: true`

**Dialog Handling Example:**

```yaml
actions:
  # Submit form
  - type: click
    selector: '#submitBtn'
    capture: true # Screenshot before dialog appears

  # Handle confirmation dialog
  - type: dialog
    action: accept # or 'dismiss'
    capture: true # Screenshot of the dialog

  # Wait for post-dialog navigation
  - type: waitForNavigation
    timeout: 2000

  # Handle second dialog if needed
  - type: dialog
    action: accept
    capture: true
```

**Dynamic Form Example:**

```yaml
actions:
  # Initial search
  - type: fill
    selector: '#searchField'
    value: 'product123'

  - type: click
    selector: '#searchBtn'

  # Wait for results
  - type: waitForNavigation
    timeout: 3000

  # Fill fields that appear after search
  - type: fill
    selector: '#quantity'
    value: '10'
    capture: true
```

### Selector Strategies

Support for multiple selector types:

```yaml
fillData:
  # ID selector
  - selector:
      by: id
      value: 'username'
    value: 'admin'

  # Name selector
  - selector:
      by: name
      value: 'email'
    value: 'user@example.com'

  # CSS selector (default)
  - selector:
      by: css
      value: '.login-form input[type="submit"]'
    value: 'Login'

  # XPath selector
  - selector:
      by: xpath
      value: '//input[@type="password"]'
    value: 'secret123'
```

### Element Type Support

Framework auto-detects element types:

- **Input fields**: text, email, password, etc.
- **Textarea**: multi-line text input
- **Select dropdowns**: Select by value, label, or index
- **Checkboxes**: check/uncheck
- **Radio buttons**: selection

```yaml
fillData:
  # Select dropdown by value
  - selector: '#country'
    value: 'USA'
    options:
      selectBy: value # or 'label' or 'index'

  # Checkbox
  - selector: '#terms'
    value: true # or 'checked', 'yes', '1'
    action: checkbox
```

### Rich Assertions

Multiple assertion types with operators:

```yaml
assertions:
  # Text content with operators
  - type: textContent
    selector: '.message'
    expected: 'Success'
    operator: equals # or 'contains' or 'regex'

  # Input value assertion
  - type: inputValue
    selector: '#username'
    expected: 'admin'
    operator: equals

  # Visibility assertion
  - type: visibility
    selector: '.error'
    expected: hidden # or 'visible'

  # Enabled/disabled state
  - type: enabled
    selector: '#submitBtn'
    expected: enabled # or 'disabled'

  # CSS style assertion
  - type: style
    selector: '.success'
    property: color
    expected: 'rgb(0, 128, 0)'
```

### Screenshot Configuration

Per-step control with automatic fallback:

```yaml
fillData:
  # Explicit capture
  - selector: '#username'
    value: 'admin'
    capture: true # Screenshot taken after this step

  # No capture
  - selector: '#password'
    value: 'secret'
    # No capture property - no screenshot
```

**Fallback Behavior**:

- If **no step** has `capture: true`, framework automatically:
  - Captures screenshot **before submit**
  - Captures screenshot **after submit**
- If **any step** has `capture: true`, no fallback screenshots

## Report Features

The HTML report includes:

- **Dashboard** with test statistics and execution time
- **Test Hierarchy Tree** showing parent-child relationships
- **Step-by-Step Details** with screenshots and timing
- **Assertion Results** with expected vs actual comparisons
- **Error Tracking** with collapsible stack traces
- **Screenshot Modal** for full-size previews

## File-Based Test Composition

### Benefits

- 🔹 **Modularity** - Each test is a separate, reusable file
- 🔹 **Maintainability** - Easier to update and version control
- 🔹 **Scalability** - Large test suites remain organized
- 🔹 **Reusability** - Child tests can be used by multiple parents
- 🔹 **Performance** - No browser restarts, faster execution

### Path Resolution

Child paths are resolved relative to the parent test file:

```
tests/
├── parent-test.yaml          # References: children/test1.yaml
├── children/
│   ├── test1.yaml
│   └── test2.yaml
└── shared/
    └── common-test.yaml      # Reusable test
```

### Browser State Preservation

When running parent→child tests:

- Browser session persists (cookies, localStorage, sessionStorage)
- No page refresh between tests
- Child starts from parent's final URL
- Optional: restore parent URL between children (configurable)

## Architecture

```
src/
├── core/
│   ├── TestExecutor.js           # Main test orchestrator
│   ├── TestFileLoader.js         # YAML file loading with circular detection
│   ├── TestOrchestrator.js       # Parent-child execution flow
│   └── ExecutionContextStack.js  # Browser state management
├── models/
│   ├── TestReport.js             # Test execution data
│   └── StepReport.js             # Step-level details
├── actions/
│   ├── ActionHandler.js          # Browser actions
│   └── ScreenshotManager.js      # Screenshot capture
├── assertions/
│   └── AssertionEngine.js        # Assertion validation
└── reporting/
    ├── ReportManager.js          # Report coordination
    ├── ReportAggregator.js       # Data aggregation
    └── HtmlReportGenerator.js    # HTML generation
```

## License

MIT
