# Unified Actions Phase - Quick Reference

## New Test Structure

```yaml
name: Test Name
url: https://example.com

# STEP 1: Actions (combines fillData + submit)
actions:
  - type: fill
    selector: '#field1'
    value: 'value1'

  - type: click
    selector: '#button1'

  - type: waitForNavigation
    timeout: 3000

  - type: fill
    selector: '#field2'
    value: 'value2'

  - type: dialog
    action: accept

# STEP 2: Assertions
assertions:
  - type: exists
    selector: '.success'
```

## Supported Action Types

| Type                | Description          | Required Fields           |
| ------------------- | -------------------- | ------------------------- |
| `fill`              | Fill input/textarea  | `selector`, `value`       |
| `click`             | Click element        | `selector`                |
| `dialog`            | Handle alert/confirm | `action` (accept/dismiss) |
| `waitForNavigation` | Wait for page load   | `timeout` (optional)      |

## Benefits

✅ **Sequential Flow** - Actions execute in order  
✅ **Intermixed Operations** - Fill, then click, then fill again  
✅ **Simpler Structure** - One phase instead of two  
✅ **Backward Compatible** - Old tests with `fillData`/`submit` still work

## Migration Example

### Old Format (3 phases)

```yaml
fillData:
  - selector: '#username'
    value: 'admin'

submit:
  - type: click
    selector: '#login'

assertions:
  - type: exists
    selector: '.dashboard'
```

### New Format (2 phases)

```yaml
actions:
  - type: fill
    selector: '#username'
    value: 'admin'

  - type: click
    selector: '#login'

assertions:
  - type: exists
    selector: '.dashboard'
```

## Your Working Test

See [`tests/create_denpyo.yaml`](file:///d:/learn/automation_test_v2/tests/create_denpyo.yaml) for a complete example with:

- Multiple fills
- Radio button selection
- Search button click
- Wait for results
- Fill dynamic fields
- Dialog handling
