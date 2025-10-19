# Registry Overrides ⚙️

Manages Windows registry overrides for VRChat configuration.

## Overview

| Property         | Value                                   |
| ---------------- | --------------------------------------- |
| **ID**           | `registry-overrides`                    |
| **Category**     | System Utility                          |
| **Tags**         | Utility, Registry, Configuration, System|
| **Dependencies** | None                                    |
| **Author**       | Bluscream                               |

## Features

- ✅ Set VRChat registry keys
- ✅ Trigger-based application (startup, game start)
- ✅ Persistent configuration
- ✅ Multiple registry value types
- ✅ JSON-based configuration
- ✅ Error handling and logging

## Settings

| Setting      | Type   | Default | Description                                    |
| ------------ | ------ | ------- | ---------------------------------------------- |
| `overrides`  | String | `{}`    | JSON object of registry keys and their triggers|

## Configuration Format

```json
{
  "RegKeyName": {
    "value": "desired value",
    "type": 3,
    "triggerOnVRCXStart": true,
    "triggerOnGameStart": false
  }
}
```

### Registry Types

| Type | Value | Description          |
| ---- | ----- | -------------------- |
| 1    | REG_SZ| String value         |
| 3    | REG_DWORD| 32-bit number     |
| 4    | REG_BINARY| Binary data      |

## Usage

### Add Registry Override

```javascript
const registry = window.customjs.getModule('registry-overrides');

// Add new override
const config = JSON.parse(registry.settings.store.overrides);
config['MyCustomKey'] = {
  value: '1',
  type: 3,
  triggerOnVRCXStart: true,
  triggerOnGameStart: false
};
registry.settings.store.overrides = JSON.stringify(config);
```

### Apply Overrides

```javascript
const registry = window.customjs.getModule('registry-overrides');
await registry.applyRegistrySettings();
```

## Trigger Types

| Trigger              | When Applied                      |
| -------------------- | --------------------------------- |
| `triggerOnVRCXStart` | When VRCX starts                  |
| `triggerOnGameStart` | When VRChat game launches         |

## Implementation Details

### Registry Path

```
HKEY_CURRENT_USER\Software\VRChat\VRChat
```

All keys are written to this path.

### Application Process

1. Reads `overrides` from settings
2. Filters by trigger condition
3. Calls `AppApi.SetVRChatRegistryKey()` for each
4. Logs success/failure per key

### Game State Monitoring

Watches for VRChat process start via VRCX's process monitor.

## Common Registry Keys

| Key                       | Purpose                           | Type |
| ------------------------- | --------------------------------- | ---- |
| `VRC_ALLOW_UNTRUSTED_URL` | Allow/block untrusted URLs        | 3    |
| `resolution_width`        | Game window width                 | 3    |
| `resolution_height`       | Game window height                | 3    |
| `graphics_quality`        | Graphics quality level            | 3    |

## Best Practices

1. **Backup first** - Export config before making changes
2. **Test carefully** - Wrong values can affect VRChat behavior
3. **Use VRCXStart trigger** - For persistent settings
4. **Document changes** - Note what each override does
5. **Restart game** - Some changes require VRChat restart

## Troubleshooting

| Issue                  | Solution                                   |
| ---------------------- | ------------------------------------------ |
| Override not applying  | Check trigger conditions, verify JSON format|
| Game behaving oddly    | Remove overrides, restart VRChat           |
| Cannot read key        | Verify registry path and permissions       |
| JSON parse error       | Validate JSON syntax                       |

## Security Note

This plugin requires registry access. Only set values you understand and trust.

## See Also

- [Auto Disable Untrusted URLs](auto-disable-untrusted-urls.md) - Uses registry for URL security

