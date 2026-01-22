# Automation Test Framework v2.0

A powerful, YAML-driven automation testing framework built on Playwright with professional HTML reporting capabilities. This framework enables you to write automated browser tests using simple YAML configuration files without writing any code.

## Features

- **YAML-Driven Testing** - Write tests in simple YAML format, no coding required
- **Professional HTML Reports** - Beautiful, responsive HTML reports with screenshots and execution details
- **Parent-Child Test Structure** - Organize complex test scenarios with hierarchical test relationships
- **Multiple Selector Strategies** - Support for CSS, ID, Name, and XPath selectors
- **Rich Assertion Library** - Comprehensive assertion types with multiple operators (equals, contains, regex)
- **Smart Screenshot Management** - Automatic and manual screenshot capture with failure detection
- **Cross-Browser Support** - Test on Chrome, Firefox, Edge, and more
- **Flexible Action System** - Sequential actions with support for fills, clicks, waits, and dialogs
- **Backward Compatible** - Supports both legacy and modern test formats

## Quick Start

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd automation_test_v2

# Install dependencies
npm install

# Install Playwright browsers (first time only)
npx playwright install
```

### Running Your First Test

```bash
# Run the default sample test
npm test

# Run a specific test file
npm test tests/sample-test.yaml

# Or using node directly
node index.js tests/your-test.yaml
```

## Project Structure

```
automation_test_v2/
������ src/
��   ������ actions/          # Action execution logic
��   ��   ������ strategies/   # Fill, click, checkbox, radio button actions
��   ������ assertions/       # Assertion engine
��   ��   ������ strategies/   # Text, visibility, input value assertions
��   ������ core/            # Core test execution engine
��   ������ models/          # Data models
��   ������ reporting/       # HTML report generation
��   ������ selectors/       # Selector resolution strategies
��   ������ utils/           # Configuration and logging utilities
������ tests/               # Test YAML files
��   ������ children/        # Child test files
������ report/              # Generated HTML reports
������ config.yaml          # Framework configuration
������ index.js             # Main entry point
������ package.json         # Project dependencies
```

## Configuration

Edit `config.yaml` to customize framework behavior:

```yaml
browser:
  type: msedge # Browser type: chrome, firefox, msedge, webkit
  headless: false # Run with UI (false) or headless (true)
  viewport:
    width: 1535
    height: 1024

report:
  enabled: true # Enable HTML reporting
  outputDir: report/ # Report output directory
  openAfterExecution: true # Auto-open report in browser
  theme: default # Report theme

screenshots:
  enabled: true # Enable screenshot capture
  onFailure: true # Auto-capture on test failures

testExecution:
  stopOnChildFailure: false # Continue or stop on child test failure
  restoreBrowserState: true # Restore browser after each child test

childTests:
  validatePaths: true # Validate child file paths
  detectCircularRefs: true # Detect circular dependencies
```

## Writing Tests

### Basic Test Structure

Create a YAML file in the `tests/` directory:

```yaml
name: My First Test
description: Test login functionality
url: https://example.com/login

# Define actions to perform
actions:
  - type: fill
    selector: '#username'
    value: 'testuser'

  - type: fill
    selector: '#password'
    value: 'password123'

  - type: click
    selector: '#login-button'

  - type: waitForNavigation
    timeout: 5000

# Define assertions to verify
assertions:
  - type: urlContains
    expected: 'dashboard'

  - type: exists
    selector: '.welcome-message'
    timeout: 3000
```

### Legacy Format (Still Supported)

```yaml
name: Login Test
url: https://example.com/login

fillData:
  - selector: '#username'
    value: 'testuser'
  - selector: '#password'
    value: 'password123'

submit:
  - type: click
    selector: '#login-button'
  - type: waitForNavigation
    timeout: 5000

assertions:
  - type: exists
    selector: '.dashboard'
```

## Supported Actions

### Modern Actions Format

| Action Type         | Description                    | Required Fields           | Optional Fields |
| ------------------- | ------------------------------ | ------------------------- | --------------- |
| `fill`              | Fill input or textarea         | `selector`, `value`       | `capture`       |
| `click`             | Click an element               | `selector`                | `capture`       |
| `dialog`            | Handle browser alerts/confirms | `action` (accept/dismiss) | -               |
| `waitForNavigation` | Wait for page navigation       | -                         | `timeout`       |

### Legacy Fill Data Types

| Data Type  | Description       | Example Selector |
| ---------- | ----------------- | ---------------- |
| `input`    | Text input fields | `#username`      |
| `textarea` | Textarea fields   | `#description`   |
| `checkbox` | Checkbox inputs   | `#agree-terms`   |
| `radio`    | Radio buttons     | `#option-yes`    |
| `select`   | Dropdown selects  | `#country`       |

## Supported Assertions

### Modern Assertions with Operators

| Assertion Type | Description         | Operators                     | Example               |
| -------------- | ------------------- | ----------------------------- | --------------------- |
| `textContent`  | Verify element text | `equals`, `contains`, `regex` | See below             |
| `inputValue`   | Verify input value  | `equals`, `contains`, `regex` | See below             |
| `visibility`   | Check visibility    | N/A                           | `visible` or `hidden` |
| `enabled`      | Check if enabled    | N/A                           | `true` or `false`     |
| `style`        | Verify CSS styles   | `equals`, `contains`          | See below             |

**Example with Operators:**

```yaml
assertions:
  - type: textContent
    selector: '.message'
    expected: 'Success'
    operator: contains # equals, contains, or regex

  - type: textContent
    selector: '.email'
    expected: '^[a-z]+@example\.com$'
    operator: regex
```

### Legacy Assertions (Still Supported)

| Type          | Description            | Fields                     |
| ------------- | ---------------------- | -------------------------- |
| `exists`      | Element exists in DOM  | `selector`, `timeout`      |
| `text`        | Element has exact text | `selector`, `expectedText` |
| `urlContains` | URL contains string    | `expectedUrl`              |

## Selector Strategies

### Simple String Selector (CSS)

```yaml
selector: '#username'
selector: '.button-primary'
selector: 'input[type="email"]'
```

### Advanced Selector Object

```yaml
# CSS Selector (default)
selector:
  by: css
  value: '.login-form input'

# ID Selector (auto-adds #)
selector:
  by: id
  value: username

# Name Attribute Selector
selector:
  by: name
  value: email

# XPath Selector
selector:
  by: xpath
  value: //button[contains(text(), 'Submit')]
```

## Parent-Child Tests

Organize complex test scenarios with parent-child relationships:

**Parent Test** (`tests/parent-test.yaml`):

```yaml
name: Login and Dashboard Test
url: https://example.com

actions:
  - type: fill
    selector: '#username'
    value: 'admin'
  - type: click
    selector: '#login'

assertions:
  - type: exists
    selector: '.dashboard'

children:
  - path: children/create-record.yaml
  - path: children/edit-record.yaml
```

**Child Test** (`tests/children/create-record.yaml`):

```yaml
name: Create New Record
url: https://example.com/records/new

actions:
  - type: fill
    selector: '#record-name'
    value: 'Test Record'
  - type: click
    selector: '#save'

assertions:
  - type: textContent
    selector: '.success-message'
    expected: 'Record created'
    operator: contains
```

## Screenshots

### Automatic Screenshots

- **On Failure**: Automatically captured when assertions fail (if `screenshots.onFailure: true`)
- **Before/After Submit**: Fallback screenshots if no explicit captures defined

### Manual Screenshots

Add `capture: true` to any action:

```yaml
actions:
  - type: fill
    selector: '#search'
    value: 'test query'
    capture: true # Takes screenshot after this action

  - type: click
    selector: '#search-button'
    capture: true
```

## HTML Reports

After test execution, an HTML report is automatically generated in the `report/` directory with:

- Test execution summary (passed/failed)
- Detailed step-by-step execution log
- Embedded screenshots at each capture point
- Assertion results with expected vs actual values
- Execution timestamps and durations
- Parent-child test hierarchy visualization

The report automatically opens in your default browser if `report.openAfterExecution: true`.

## Example Test Files

The framework includes several example tests in the `tests/` directory:

- **`sample-test.yaml`** - Basic test with parent-child structure
- **`assertion-operators-demo.yaml`** - Demonstrates all assertion operators
- **`selector-strategies-demo.yaml`** - Shows all selector strategies
- **`explicit-screenshot-demo.yaml`** - Manual screenshot examples
- **`parent-test.yaml`** - Parent-child test organization

## Development

### Code Formatting

```bash
# Format all code with Prettier
npm run format
```

### Pre-commit Hooks

The project uses Husky and lint-staged to automatically format code before commits:

- All files are automatically formatted with Prettier on commit
- Ensures consistent code style across the project

## Troubleshooting

### Browser Not Launching

```bash
# Reinstall Playwright browsers
npx playwright install
```

### Test File Not Found

- Ensure the test file path is relative to the project root
- Use forward slashes `/` in paths, even on Windows

### Screenshots Not Appearing

- Check `config.yaml` - ensure `screenshots.enabled: true`
- Verify the `report/` directory exists
- Check browser permissions for screenshot capture

### Report Not Opening

- Set `report.openAfterExecution: false` if auto-open causes issues
- Manually open `report/test-report.html` in your browser

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [YAML Syntax Guide](https://yaml.org/)
- [CSS Selector Reference](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)
- [XPath Tutorial](https://www.w3schools.com/xml/xpath_intro.asp)
- **[Test Scenario Guide](TEST_SCENARIO_GUIDE.md)** - Detailed guide on creating test scenarios

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

Built with [Playwright](https://playwright.dev/) - the modern web automation framework.

---

**Happy Testing!**
