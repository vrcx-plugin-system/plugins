# User Badge Pipeline Patch 🎖️

Patches the user badge rendering pipeline to add custom badges and modify badge display.

## Overview

| Property         | Value                                 |
| ---------------- | ------------------------------------- |
| **ID**           | `user-badge-pipeline-patch`           |
| **Category**     | Visual Patch                          |
| **Tags**         | Patch, UI, Badges, Customization      |
| **Dependencies** | None                                  |
| **Author**       | Bluscream                             |

## Features

- ✅ Patches badge rendering pipeline
- ✅ Allows custom badge injection
- ✅ Modifies existing badge rendering
- ✅ Intercepts badge handlers
- ✅ Logs patching success

## How It Works

### Patch Target

Patches user badge rendering handlers in VRCX's badge system.

### Patching Process

1. Locates badge handler functions
2. Wraps original handlers
3. Allows pre/post processing
4. Injects custom badges
5. Logs operations

## Implementation

The patch is applied at plugin load time and remains active until plugin unload.

## Current Functionality

This is a **base patch plugin** that other plugins can build upon to:
- Add custom badges (VIP, Supporter, etc.)
- Modify badge colors
- Change badge ordering
- Filter/hide certain badges

## Future Enhancements

- Settings for custom badge definitions
- Badge color customization
- Badge filter rules
- Badge priority ordering

## Usage

### For Plugin Developers

Other plugins can hook into the patched pipeline:

```javascript
// Example: Add custom badge
const patchPlugin = window.customjs.getModule('user-badge-pipeline-patch');

// Hook will be available in future updates
```

## Implementation Details

### Badge Handler Location

Patches handlers in VRCX's user badge rendering system (implementation may vary by VRCX version).

## Best Practices

1. **Keep enabled** - Required for badge customization features
2. **Load early** - Other badge plugins may depend on this

## Troubleshooting

| Issue                | Solution                                   |
| -------------------- | ------------------------------------------ |
| Badges not showing   | Check if VRCX updated badge system         |
| Patch failing        | Check console for errors                   |
| Custom badges missing| Ensure dependent plugins are loaded        |

## See Also

- Plugins that might use this patch (future implementations)

