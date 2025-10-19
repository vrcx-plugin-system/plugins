# Auto Disable Untrusted URLs 🛡️

Automatically disables VRChat's untrusted URL feature for security.

## Overview

| Property         | Value                                  |
| ---------------- | -------------------------------------- |
| **ID**           | `auto-disable-untrusted-urls`          |
| **Category**     | Security                               |
| **Tags**         | Security, Registry, Automation         |
| **Dependencies** | None                                   |
| **Author**       | Bluscream                              |

## Features

- ✅ Disables untrusted URLs on VRCX start
- ✅ Disables untrusted URLs on VRChat start
- ✅ Automatic registry modification
- ✅ Configurable triggers
- ✅ Logs all operations

## Settings

| Setting                | Type    | Default | Description                              |
| ---------------------- | ------- | ------- | ---------------------------------------- |
| `triggerOnVRCXStart`   | Boolean | `true`  | Disable URLs when VRCX starts            |
| `triggerOnGameStart`   | Boolean | `true`  | Disable URLs when VRChat starts          |

## Usage

### Manual Trigger

```javascript
const urlDisabler = window.customjs.getModule('auto-disable-untrusted-urls');
await urlDisabler.disableUntrustedUrls();
```

## How It Works

### Registry Modification

Sets Windows registry key:
```
Path: HKEY_CURRENT_USER\Software\VRChat\VRChat
Key:  VRC_ALLOW_UNTRUSTED_URL
Value: 0 (disabled)
Type: REG_DWORD (3)
```

### Trigger Monitoring

- **VRCX Start**: Applies immediately on plugin start
- **Game Start**: Watches for VRChat process launch

### Game Process Detection

Monitors for `vrchat.exe` process via VRCX's process monitor.

## Security Benefits

Disabling untrusted URLs prevents:
- Malicious image/video embeds
- Tracking pixels
- External resource loading
- Potential exploit vectors

## Implementation Details

Uses `AppApi.SetVRChatRegistryKey()`:
```javascript
await AppApi.SetVRChatRegistryKey(
  'VRC_ALLOW_UNTRUSTED_URL',
  0,  // 0 = disabled
  3   // REG_DWORD
);
```

## Best Practices

1. **Keep enabled** - Recommended for security
2. **Use both triggers** - Ensures protection
3. **Check after VRChat updates** - VRChat may reset the value

## Troubleshooting

| Issue                      | Solution                              |
| -------------------------- | ------------------------------------- |
| URLs still loading         | Check registry value, restart VRChat  |
| Setting not applying       | Verify VRCX has registry permissions  |
| VRChat overrides setting   | Re-enable both triggers               |

## See Also

- [Registry Overrides](registry-overrides.md) - General registry management

