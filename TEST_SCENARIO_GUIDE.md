# Test Scenario Creation and Execution Guide

This guide will walk you through creating test scenarios from scratch and running them with the Automation Test Framework v2.0.

## ? Table of Contents

1. [Quick Start](#quick-start)
2. [Understanding Test Structure](#understanding-test-structure)
3. [Creating Your First Test](#creating-your-first-test)
4. [Advanced Test Scenarios](#advanced-test-scenarios)
5. [Running Tests](#running-tests)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## ? Quick Start

### Step 1: Create a Test File

Create a new YAML file in the `tests/` directory:

```bash
# Create a new test file
tests/my-login-test.yaml
```

### Step 2: Write Your Test

```yaml
name: Login Test
description: Test user login functionality
url: https://example.com/login

actions:
  - type: fill
    selector: '#username'
    value: 'testuser'

  - type: fill
    selector: '#password'
    value: 'password123'

  - type: click
    selector: '#login-button'

assertions:
  - type: exists
    selector: '.dashboard'
```

### Step 3: Run Your Test

```bash
npm test tests/my-login-test.yaml
```

## ?? Understanding Test Structure

Every test YAML file consists of these main sections:

### 1. **Metadata** (Required)

```yaml
name: Test Name Here
description: What this test does (optional but recommended)
url: https://your-target-url.com
```

### 2. **Actions** (Optional)

Actions are the steps the browser will perform:

```yaml
actions:
  - type: fill # Fill a form field
  - type: click # Click a button/link
  - type: dialog # Handle alert/confirm dialogs
  - type: waitForNavigation # Wait for page to load
```

### 3. **Assertions** (Optional)

Assertions verify that expected outcomes occurred:

```yaml
assertions:
  - type: exists # Element exists
  - type: textContent # Text matches expectation
  - type: visibility # Element is visible/hidden
  - type: inputValue # Input has expected value
```

### 4. **Children** (Optional)

Child tests that run after the parent:

```yaml
children:
  - path: children/next-test.yaml
  - path: children/another-test.yaml
```

## ? Creating Your First Test

Let's create a complete test step-by-step.

### Scenario: Test a Contact Form

**Goal**: Fill out a contact form and verify submission success.

**Step 1: Create the file** - `tests/contact-form-test.yaml`

**Step 2: Add metadata**

```yaml
name: Contact Form Submission Test
description: Verify contact form can be filled and submitted successfully
url: https://example.com/contact
```

**Step 3: Add actions to fill the form**

```yaml
actions:
  # Fill the name field
  - type: fill
    selector: '#name'
    value: 'John Doe'

  # Fill the email field
  - type: fill
    selector: '#email'
    value: 'john@example.com'

  # Fill the message textarea
  - type: fill
    selector: '#message'
    value: 'This is a test message'

  # Click the submit button
  - type: click
    selector: 'button[type="submit"]'

  # Wait for the page to process
  - type: waitForNavigation
    timeout: 5000
```

**Step 4: Add assertions to verify success**

```yaml
assertions:
  # Check that success message appears
  - type: textContent
    selector: '.success-message'
    expected: 'Thank you'
    operator: contains

  # Verify we're on the confirmation page
  - type: urlContains
    expected: 'success'
```

**Complete test file:**

```yaml
name: Contact Form Submission Test
description: Verify contact form can be filled and submitted successfully
url: https://example.com/contact

actions:
  - type: fill
    selector: '#name'
    value: 'John Doe'

  - type: fill
    selector: '#email'
    value: 'john@example.com'

  - type: fill
    selector: '#message'
    value: 'This is a test message'

  - type: click
    selector: 'button[type="submit"]'

  - type: waitForNavigation
    timeout: 5000

assertions:
  - type: textContent
    selector: '.success-message'
    expected: 'Thank you'
    operator: contains

  - type: urlContains
    expected: 'success'
```

## ? Advanced Test Scenarios

### Scenario 1: E-commerce Checkout Flow

```yaml
name: Product Purchase Flow
description: Complete product purchase from search to checkout
url: https://shop.example.com

actions:
  # Search for product
  - type: fill
    selector: '#search-input'
    value: 'laptop'

  - type: click
    selector: '#search-button'

  - type: waitForNavigation
    timeout: 3000

  # Add to cart
  - type: click
    selector: '.product-card:first-child .add-to-cart'

  # Go to cart
  - type: click
    selector: '#cart-icon'

  # Proceed to checkout
  - type: click
    selector: '#checkout-button'

  # Fill shipping info
  - type: fill
    selector: '#shipping-name'
    value: 'Jane Smith'

  - type: fill
    selector: '#shipping-address'
    value: '123 Main St'

  - type: fill
    selector: '#shipping-city'
    value: 'New York'

  # Select shipping method (dropdown)
  - type: fill
    selector: '#shipping-method'
    value: 'express'

  # Complete order
  - type: click
    selector: '#complete-order'

assertions:
  - type: textContent
    selector: '.order-confirmation'
    expected: 'Order Placed Successfully'
    operator: contains

  - type: exists
    selector: '.order-number'
```

### Scenario 2: Form with Validation and Dialog

```yaml
name: User Registration with Validation
description: Test registration form with client-side validation
url: https://example.com/register

actions:
  # Fill registration form
  - type: fill
    selector: '#username'
    value: 'newuser123'

  - type: fill
    selector: '#email'
    value: 'newuser@example.com'

  - type: fill
    selector: '#password'
    value: 'SecurePass123!'

  - type: fill
    selector: '#confirm-password'
    value: 'SecurePass123!'

  # Accept terms checkbox
  - type: click
    selector: '#accept-terms'

  # Submit form
  - type: click
    selector: '#register-button'

  # Handle confirmation dialog
  - type: dialog
    action: accept

assertions:
  - type: visibility
    selector: '.registration-success'
    expected: visible

  - type: textContent
    selector: '.welcome-message'
    expected: 'Welcome, newuser123'
    operator: contains
```

### Scenario 3: Multi-Page Parent-Child Test

**Parent Test** - `tests/login-and-navigate.yaml`

```yaml
name: Login and Dashboard Test Suite
description: Login and execute dashboard operations
url: https://app.example.com/login

actions:
  - type: fill
    selector: '#username'
    value: 'admin'

  - type: fill
    selector: '#password'
    value: 'admin123'

  - type: click
    selector: '#login-button'

  - type: waitForNavigation
    timeout: 5000

assertions:
  - type: exists
    selector: '.dashboard'

  - type: textContent
    selector: '.user-greeting'
    expected: 'Welcome, admin'
    operator: contains

children:
  - path: children/create-project.yaml
  - path: children/view-reports.yaml
```

**Child Test 1** - `tests/children/create-project.yaml`

```yaml
name: Create New Project
description: Create a new project from the dashboard
url: https://app.example.com/projects/new

actions:
  - type: fill
    selector: '#project-name'
    value: 'Test Project 2024'

  - type: fill
    selector: '#project-description'
    value: 'Automated test project'

  - type: click
    selector: '#create-project-btn'

assertions:
  - type: textContent
    selector: '.success-alert'
    expected: 'Project created successfully'
    operator: contains
```

**Child Test 2** - `tests/children/view-reports.yaml`

```yaml
name: View Analytics Reports
description: Navigate to and verify reports page
url: https://app.example.com/reports

assertions:
  - type: exists
    selector: '.report-dashboard'

  - type: visibility
    selector: '#analytics-chart'
    expected: visible

  - type: textContent
    selector: 'h1'
    expected: 'Analytics Reports'
    operator: equals
```

## ? Selector Reference Guide

### Finding the Right Selector

**1. Using Browser DevTools:**

- Right-click on element �� Inspect
- Look for `id`, `class`, `name` attributes
- Use the element picker tool

**2. CSS Selectors (Most Common):**

```yaml
# By ID
selector: '#username'

# By Class
selector: '.submit-button'

# By Attribute
selector: 'input[type="email"]'

# By Hierarchy
selector: '.login-form input[name="password"]'

# Nth Child
selector: '.product-list .product:nth-child(2)'
```

**3. Using Selector Strategies:**

```yaml
# ID Strategy (cleaner)
selector:
  by: id
  value: username

# XPath for complex cases
selector:
  by: xpath
  value: //button[contains(text(), 'Submit')]

# Name attribute
selector:
  by: name
  value: email
```

## ? Action Types Reference

### Fill Action

```yaml
- type: fill
  selector: '#input-field'
  value: 'text to fill'
  capture: true # Optional: take screenshot after
```

**Use for:** Text inputs, textareas, dropdowns, checkboxes, radio buttons

### Click Action

```yaml
- type: click
  selector: '#button'
  capture: true # Optional: take screenshot after
```

**Use for:** Buttons, links, any clickable element

### Dialog Action

```yaml
- type: dialog
  action: accept # or 'dismiss'
```

**Use for:** Handling JavaScript `alert()`, `confirm()`, `prompt()` dialogs

### Wait for Navigation

```yaml
- type: waitForNavigation
  timeout: 5000 # milliseconds
```

**Use for:** After clicks that trigger page navigation, form submissions

## ? Assertion Types Reference

### textContent Assertion

```yaml
- type: textContent
  selector: '.message'
  expected: 'Success'
  operator: contains # or 'equals', 'regex'
  timeout: 3000 # optional
```

**Operators:**

- `equals` - Exact match
- `contains` - Text contains substring
- `regex` - Regular expression match

### inputValue Assertion

```yaml
- type: inputValue
  selector: '#email'
  expected: 'user@example.com'
  operator: equals
```

**Use for:** Verifying input field values

### visibility Assertion

```yaml
- type: visibility
  selector: '.modal'
  expected: visible # or 'hidden'
```

**Use for:** Checking if elements are visible or hidden

### exists Assertion (Legacy)

```yaml
- type: exists
  selector: '.dashboard'
  timeout: 3000
```

**Use for:** Simple element existence check

### urlContains Assertion

```yaml
- type: urlContains
  expected: 'success'
```

**Use for:** Verifying URL navigation

## ? Running Tests

### Basic Execution

```bash
# Run default test
npm test

# Run specific test
npm test tests/my-test.yaml

# Run with node directly
node index.js tests/my-test.yaml
```

### Configuration

Edit `config.yaml` before running:

```yaml
browser:
  type: msedge # chrome, firefox, webkit
  headless: false # true for headless mode

report:
  enabled: true
  openAfterExecution: true # Auto-open report

screenshots:
  enabled: true
  onFailure: true # Capture on failures
```

### Understanding Output

**Console Output:**

```
======================================================================
  AUTOMATION TEST FRAMEWORK v2.0
  Professional HTML Reporting
======================================================================

[INFO] Running test file: tests/my-test.yaml
[INFO] Navigating to: https://example.com
[INFO] Executing actions...
[SUCCESS] All assertions passed
[INFO] Report generated: report/test-report.html

? Test execution completed successfully!
```

**HTML Report:**

- Automatically opens in browser (if configured)
- Shows pass/fail status for each step
- Includes screenshots at key points
- Contains detailed error messages for failures

## ? Best Practices

### 1. **Descriptive Test Names**

```yaml
# Good
name: User Login with Valid Credentials

# Bad
name: Test 1
```

### 2. **Use Stable Selectors**

```yaml
# Good (specific, unlikely to change)
selector: '#submit-button'
selector: '[data-testid="login-btn"]'

# Avoid (fragile, may break)
selector: 'body > div > div > button:nth-child(3)'
```

### 3. **Add Waits After Navigation**

```yaml
actions:
  - type: click
    selector: '#submit'

  - type: waitForNavigation
    timeout: 5000 # Give page time to load
```

### 4. **Capture Screenshots for Important Steps**

```yaml
actions:
  - type: fill
    selector: '#payment-info'
    value: '1234-5678-9012-3456'
    capture: true # Document this critical step
```

### 5. **Use Child Tests for Modularity**

Break complex tests into reusable child tests:

```
tests/
  ������ login-test.yaml (parent)
  ������ children/
      ������ create-item.yaml
      ������ edit-item.yaml
      ������ delete-item.yaml
```

### 6. **Add Timeouts for Slow Operations**

```yaml
assertions:
  - type: exists
    selector: '.loading-complete'
    timeout: 10000 # Wait up to 10 seconds
```

### 7. **Verify Multiple Aspects**

```yaml
assertions:
  # Check URL changed
  - type: urlContains
    expected: 'success'

  # Check success message
  - type: textContent
    selector: '.message'
    expected: 'Complete'
    operator: contains

  # Check element visible
  - type: visibility
    selector: '.confirmation'
    expected: visible
```

## ? Troubleshooting

### Issue: Element Not Found

```
Error: Element not found: #submit-button
```

**Solutions:**

1. Verify selector in browser DevTools
2. Add wait time before action:

```yaml
- type: waitForNavigation
  timeout: 3000
```

3. Check if element is in an iframe (currently not supported)

### Issue: Assertion Fails

```
Expected: "Success", Actual: "Error: Invalid input"
```

**Solutions:**

1. Check if page loaded completely
2. Verify expected value is correct
3. Use `contains` instead of `equals` for partial matches:

```yaml
operator: contains # instead of equals
```

### Issue: Test Times Out

```
Timeout waiting for element
```

**Solutions:**

1. Increase timeout value:

```yaml
timeout: 10000 # 10 seconds
```

2. Check if selector is correct
3. Verify page doesn't have errors preventing load

### Issue: Screenshots Not Captured

**Solutions:**

1. Enable in config:

```yaml
screenshots:
  enabled: true
```

2. Add `capture: true` to actions
3. Check report directory permissions

### Issue: Child Test Not Found

```
Error: Child test file not found
```

**Solutions:**

1. Use path relative to project root:

```yaml
children:
  - path: children/test.yaml # NOT /children/test.yaml
```

2. Verify file exists in tests directory
3. Check file name spelling

## ? Example Scenarios Library

### Login Test

```yaml
name: Login Test
url: https://example.com/login

actions:
  - type: fill
    selector: '#username'
    value: 'testuser'
  - type: fill
    selector: '#password'
    value: 'pass123'
  - type: click
    selector: '#login-btn'

assertions:
  - type: urlContains
    expected: 'dashboard'
```

### Form Submission

```yaml
name: Contact Form
url: https://example.com/contact

actions:
  - type: fill
    selector: '#name'
    value: 'John Doe'
  - type: fill
    selector: '#email'
    value: 'john@example.com'
  - type: fill
    selector: '#message'
    value: 'Test message'
  - type: click
    selector: 'button[type="submit"]'

assertions:
  - type: textContent
    selector: '.success'
    expected: 'sent successfully'
    operator: contains
```

### Search Functionality

```yaml
name: Search Test
url: https://example.com

actions:
  - type: fill
    selector: '#search-box'
    value: 'test query'
  - type: click
    selector: '#search-button'
  - type: waitForNavigation
    timeout: 3000

assertions:
  - type: exists
    selector: '.search-results'
  - type: textContent
    selector: '.result-count'
    expected: '\\d+ results'
    operator: regex
```

---

## ? Next Steps

1. **Create your first test** following the examples
2. **Run it** with `npm test tests/your-test.yaml`
3. **Review the HTML report** for results
4. **Iterate** and add more test scenarios
5. **Organize** complex tests with parent-child structure

**Happy Testing!** ?

For more information, see the main [README.md](README.md) or check the example tests in the `tests/` directory.
