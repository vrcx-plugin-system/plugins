# Debug Plugin 🐛

Development and debugging utilities for the VRCX plugin system.

## Overview

| Property         | Value                              |
| ---------------- | ---------------------------------- |
| **ID**           | `debug`                            |
| **Category**     | Development                        |
| **Tags**         | Debug, Development, Testing        |
| **Dependencies** | None                               |
| **Author**       | Bluscream                          |

## Features

- ✅ Console logging utilities
- ✅ Plugin state inspection
- ✅ Event monitoring
- ✅ Performance profiling helpers
- ✅ Resource tracking inspection

## Purpose

This plugin provides debugging utilities for plugin developers to:
- Inspect plugin states
- Monitor events
- Profile performance
- Track resource usage
- Debug issues

## Usage

```javascript
const debug = window.customjs.getModule('debug');

// Access debugging utilities
// (See source code for available methods)
```

## Best Practices

1. **Disable in production** - Only enable during development
2. **Check console** - Debug output goes to browser console
3. **Monitor performance** - Use profiling to optimize plugins

## See Also

- [DevTools Button](devtools-button.md) - Quick access to browser DevTools
- [Logger Test](logger-test.md) - Tests logging functionality

