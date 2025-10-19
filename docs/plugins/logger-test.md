# Logger Tester 🧪

Test plugin demonstrating all logger methods and notification types.

## Overview

| Property         | Value                                |
| ---------------- | ------------------------------------ |
| **ID**           | `logger-test`                        |
| **Category**     | Test Plugin                          |
| **Tags**         | Test, Example, Logger, Development   |
| **Dependencies** | None                                 |
| **Author**       | Bluscream                            |

## Purpose

Demonstrates and tests all logger methods available in the plugin system:
- Console logging (`log`, `warn`, `error`)
- VRCX notifications (`showInfo`, `showSuccess`, `showWarning`, `showError`)
- Log levels and formatting

## Action Buttons

| Button                | Tests                              |
| --------------------- | ---------------------------------- |
| **Test All Logs**     | Tests all logger methods           |
| **Test Info**         | Tests info notification            |
| **Test Success**      | Tests success notification         |
| **Test Warning**      | Tests warning notification         |
| **Test Error**        | Tests error notification           |

## Settings

| Setting           | Type    | Default | Description                        |
| ----------------- | ------- | ------- | ---------------------------------- |
| `showOnLogin`     | Boolean | `false` | Automatically test on login        |

## Usage

### Test All Logger Methods

Click "Test All Logs" button to see:
- `this.logger.log()` - Console only
- `this.logger.warn()` - Console warning
- `this.logger.error()` - Console error
- `this.logger.showInfo()` - VRCX notification (info)
- `this.logger.showSuccess()` - VRCX notification (success)
- `this.logger.showWarning()` - VRCX notification (warning)
- `this.logger.showError()` - VRCX notification (error)

### Programmatic Testing

```javascript
const loggerTest = window.customjs.getModule('logger-test');

// Test individual methods
loggerTest.testInfo();
loggerTest.testSuccess();
loggerTest.testWarning();
loggerTest.testError();
```

## Logger Methods Reference

| Method              | Output Location      | Use Case                    |
| ------------------- | -------------------- | --------------------------- |
| `log()`             | Browser console      | General logging             |
| `warn()`            | Browser console      | Warnings                    |
| `error()`           | Browser console      | Errors                      |
| `showInfo()`        | VRCX notification    | Info messages to user       |
| `showSuccess()`     | VRCX notification    | Success confirmations       |
| `showWarning()`     | VRCX notification    | Warning alerts              |
| `showError()`       | VRCX notification    | Error alerts                |

## Best Practices

1. **Disable after testing** - Not needed in normal use
2. **Use for development** - Helpful when creating new plugins
3. **Check console** - Browser console shows all log output

## See Also

- [Debug Plugin](debug.md) - Debug utilities
- [Template Plugin](template.md) - Plugin development template

