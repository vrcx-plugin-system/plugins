# Start Game Button 🎮

Adds a navigation menu button to launch VRChat in various modes.

## Overview

| Property         | Value                    |
| ---------------- | ------------------------ |
| **ID**           | `start-game-button`      |
| **Category**     | Utility                  |
| **Tags**         | Utility, Game, Launcher  |
| **Dependencies** | `nav-menu-api` (required)|
| **Author**       | Bluscream                |

## Features

- ✅ Launch VRChat in Desktop mode
- ✅ Launch VRChat in VR mode
- ✅ Launch VRChat in No-VR mode
- ✅ Custom launch arguments support
- ✅ Path override support
- ✅ Confirmation dialogs before launch
- ✅ Configuration reading from VRCX settings

## Action Buttons

| Button             | Description                     |
| ------------------ | ------------------------------- |
| **Launch Desktop** | Launch VRChat in Desktop mode   |
| **Launch VR**      | Launch VRChat in VR mode        |
| **Launch No-VR**   | Launch VRChat in No-VR mode     |

## Launch Modes

| Mode     | Description                                  | Arguments |
| -------- | -------------------------------------------- | --------- |
| Desktop  | Standard desktop mode                        | None      |
| VR       | Virtual reality mode                         | `--vr`    |
| No-VR    | Desktop mode with VR explicitly disabled     | `--no-vr` |

## Configuration

Reads from VRCX configuration:

| Config Key               | Description                        |
| ------------------------ | ---------------------------------- |
| `VRCX_VRChatPath`        | Custom VRChat exe path override    |
| `VRCX_StartAsAdminVRChat`| Launch with admin privileges       |
| `VRCX_VRChatLaunchArguments` | Additional command-line args |

## Usage

### From UI

1. Click the "Start Game" tab in VRCX navigation menu
2. Choose launch mode (Desktop, VR, or No-VR)
3. Confirm launch in dialog
4. VRChat launches

### Launch Programmatically

```javascript
const startButton = window.customjs.getModule('start-game-button');

// Launch in desktop mode
await startButton.launchGame('Desktop');

// Launch in VR mode
await startButton.launchGame('VR');

// Launch in No-VR mode
await startButton.launchGame('No-VR');
```

## Implementation Details

### Launch Process

1. Reads configuration values from VRCX
2. Builds argument string based on mode
3. Shows confirmation dialog with details
4. Calls `AppApi.StartVRChat()` if confirmed

### Configuration Fallbacks

- Path: Uses VRCX default if `VRCX_VRChatPath` not set
- Arguments: Empty string if `VRCX_VRChatLaunchArguments` not set
- Admin: Defaults to `false` if `VRCX_StartAsAdminVRChat` not set

## Troubleshooting

| Issue                | Solution                                     |
| -------------------- | -------------------------------------------- |
| VRChat won't launch  | Check VRChat installation path in VRCX       |
| Wrong mode launching | Verify launch arguments in VRCX settings     |
| Permission errors    | Enable "Start as Admin" in VRCX settings     |

## See Also

- [Navigation Menu API](nav-menu-api.md)
- [Dialog API](dialog-api.md)

