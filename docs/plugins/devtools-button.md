# DevTools Button 🔧

Adds a navigation menu button to quickly open browser DevTools.

## Overview

| Property         | Value                     |
| ---------------- | ------------------------- |
| **ID**           | `devtools-button`         |
| **Category**     | Utility                   |
| **Tags**         | Utility, DevTools, Debug  |
| **Dependencies** | `nav-menu-api` (required) |
| **Author**       | Bluscream                 |

## Features

- ✅ One-click DevTools access
- ✅ Navigation menu integration
- ✅ Uses VRCX's built-in DevTools API
- ✅ Simple and lightweight

## Usage

### From UI

1. Click the "DevTools" tab in VRCX navigation menu
2. DevTools window opens immediately

### From Console

```javascript
const devTools = window.customjs.getModule("devtools-button");
// DevTools button is automatic - no manual methods needed
```

### Direct Method

```javascript
// Open DevTools directly
if (window.AppApi?.OpenDevTools) {
  window.AppApi.OpenDevTools();
}
```

## Implementation

Uses VRCX's `AppApi.OpenDevTools()` method to launch the browser DevTools window.

## See Also

- [Navigation Menu API](nav-menu-api.md)
