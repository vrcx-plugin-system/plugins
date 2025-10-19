# Invisible Players Monitor 👻

Detects and tracks invisible/ghost players in VRChat instances.

## Overview

| Property         | Value                                         |
| ---------------- | --------------------------------------------- |
| **ID**           | `monitor-invisibleplayers`                    |
| **Category**     | Social Feature                                |
| **Tags**         | Social, Monitoring, Instance, Detection       |
| **Dependencies** | None                                          |
| **Author**       | Bluscream                                     |

## Features

- ✅ Detects invisible players in instances
- ✅ Modifies instance display name with count
- ✅ Desktop notifications
- ✅ Real-time monitoring
- ✅ Instance data tracking
- ✅ Automatic updates when players join/leave

## Settings

### Display

| Setting                 | Type    | Default | Description                                  |
| ----------------------- | ------- | ------- | -------------------------------------------- |
| `modifyInstanceName`    | Boolean | `true`  | Add invisible player count to instance name  |

### Notifications

| Setting            | Type    | Default | Description                               |
| ------------------ | ------- | ------- | ----------------------------------------- |
| `showNotification` | Boolean | `true`  | Show notification when invisible players found |

## Usage

### Check Current Instance

```javascript
const monitor = window.customjs.getModule('monitor-invisibleplayers');

// Monitor automatically runs - no manual methods needed
```

## How It Works

### Detection Method

Compares:
- `instance.capacity` - Maximum player count
- `instance.users` - Visible player count
- Difference = Invisible players

### Instance Name Modification

Original: `World Name (5/20)`
Modified: `World Name (5/20) [+2 👻]`

Where `+2` represents 2 invisible/ghost players.

### Notification

Shows desktop notification when invisible players detected:
```
👻 Invisible Players Detected

2 invisible players in this instance
World: World Name
Visible: 5 / Total: 7
```

## Implementation Details

### Instance Data Source

```javascript
window.$pinia?.instance?.currentInstance
```

### Update Triggers

- Instance join
- Player join/leave events
- Instance data updates

## Best Practices

1. **Keep notifications on** - Important security awareness
2. **Watch for patterns** - Frequent invisibles may indicate issues
3. **Report to VRChat** - If encountering malicious invisibles

## Troubleshooting

| Issue                    | Solution                                  |
| ------------------------ | ----------------------------------------- |
| No detection             | Check if instance data available in Pinia |
| False positives          | May occur during instance transitions     |
| Instance name not updating| Verify `modifyInstanceName` is enabled   |

## See Also

- [Yoinker Detector](yoinker-detector.md) - Detects avatar rippers

