# Bio Symbols Patch 🔤

Patches VRChat bio symbol replacement to preserve emoji and special characters.

## Overview

| Property         | Value                              |
| ---------------- | ---------------------------------- |
| **ID**           | `bio-symbols-patch`                |
| **Category**     | Utility Patch                      |
| **Tags**         | Patch, Bio, Symbols, Emoji         |
| **Dependencies** | None                               |
| **Author**       | Bluscream                          |

## Features

- ✅ Preserves emojis in bios
- ✅ Preserves special Unicode characters
- ✅ Preserves symbols (★, ♥, ✓, etc.)
- ✅ No-op patching (prevents symbol stripping)
- ✅ Proxy-based implementation
- ✅ Fallback to direct patching

## How It Works

### Patch Target

Patches `window.utils.replaceBioSymbols()` to become a no-op function that returns input unchanged.

### Patching Methods

1. **Direct Patching** (preferred):
```javascript
window.utils.replaceBioSymbols = (text) => text;
```

2. **Proxy Patching** (fallback):
```javascript
window.utils = new Proxy(window.utils, {
  get(target, prop) {
    if (prop === 'replaceBioSymbols') {
      return (text) => text;
    }
    return target[prop];
  }
});
```

### Why This is Needed

VRCX's default `replaceBioSymbols()` strips many Unicode characters to prevent rendering issues, but also removes legitimate emojis and symbols that users want to keep.

## Usage

### Automatic

The patch applies automatically when the plugin loads. No configuration needed.

### Verification

```javascript
// Test if patch is working
const result = window.utils.replaceBioSymbols('Test 🎮 ★ ✓');
console.log(result);
// Should output: "Test 🎮 ★ ✓" (unchanged)
```

## Implementation Details

### Detection

Checks if `window.utils.replaceBioSymbols` exists before patching.

### Logging

Logs which patching method succeeded:
- Direct patching success
- Proxy patching success  
- Patching failure (rare)

## Affected Areas

Bios in these contexts preserve symbols:
- User bio display
- Bio editor
- Friend bios
- Search results

## Best Practices

1. **Keep enabled** - Unless you specifically need symbol stripping
2. **Test bios** - Verify emojis appear correctly
3. **No configuration needed** - Works automatically

## Troubleshooting

| Issue                    | Solution                                 |
| ------------------------ | ---------------------------------------- |
| Emojis still being stripped | Check if patch loaded successfully    |
| Bio rendering weird      | May be a VRChat client issue, not patch  |
| Patch not applying       | Check browser console for errors         |

## See Also

- [Bio Updater](bio-updater.md) - Updates your bio with template
- [Bio Change Notifier](bio-change-notifier.md) - Monitors bio changes

