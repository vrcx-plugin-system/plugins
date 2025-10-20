# Update Checker 🔄

Automatically checks for updates to the VRCX Plugin System core and plugins with hot-reload support.

## Overview

| Property         | Value                        |
| ---------------- | ---------------------------- |
| **ID**           | `update-checker`             |
| **Category**     | Utility                      |
| **Tags**         | Utility, Updates, Automation |
| **Dependencies** | `dialog-api` (required)      |
| **Author**       | Bluscream                    |

## Features

- ✅ Automatic core system update checking
- ✅ Automatic plugin update checking
- ✅ Hot-reload plugins without VRCX restart
- ✅ GitHub API rate limit tracking
- ✅ New plugin discovery notifications
- ✅ Configurable check intervals
- ✅ Dismissible update notifications
- ✅ Optional GitHub token for higher rate limits

## Action Buttons

| Button                      | Description                             |
| --------------------------- | --------------------------------------- |
| **Check Core Updates**      | Manually check for core system updates  |
| **Check Plugin Updates**    | Manually check for plugin updates       |
| **Download Core Update**    | Download and install core system update |
| **Show Rate Limit Status**  | Display current GitHub API rate limit   |
| **Reset Dismissed Updates** | Clear dismissed update notifications    |

## Settings

### Core Update Checking

| Setting                   | Type     | Default | Description                                          |
| ------------------------- | -------- | ------- | ---------------------------------------------------- |
| `checkCoreOnStartup`      | Boolean  | `true`  | Check for core updates on app start                  |
| `coreCheckInterval`       | Timespan | 1 hour  | How often to check for core updates (min: 5 minutes) |
| `showCoreNotification`    | Boolean  | `true`  | Show notification when update available              |
| `openReleasePageOnUpdate` | Boolean  | `false` | Auto-open release page on update                     |

### Plugin Update Checking

| Setting                 | Type     | Default | Description                                            |
| ----------------------- | -------- | ------- | ------------------------------------------------------ |
| `checkPluginsOnStartup` | Boolean  | `true`  | Check for plugin updates on app start                  |
| `pluginCheckInterval`   | Timespan | 2 hours | How often to check for plugin updates (min: 5 minutes) |
| `autoUpdatePlugins`     | Boolean  | `false` | Auto hot-reload plugins without confirmation           |
| `showNewPlugins`        | Boolean  | `true`  | Show modal when new plugins discovered                 |

### GitHub API

| Setting                 | Type    | Default | Description                                                      |
| ----------------------- | ------- | ------- | ---------------------------------------------------------------- |
| `githubToken`           | String  | ``      | Personal access token (increases limit from 60 to 5000 req/hour) |
| `showRateLimitWarnings` | Boolean | `true`  | Warn when approaching rate limits                                |

### Notification Settings

| Setting                      | Type    | Default | Description                             |
| ---------------------------- | ------- | ------- | --------------------------------------- |
| `enableDesktopNotifications` | Boolean | `true`  | Show Windows desktop notifications      |
| `enableVrNotifications`      | Boolean | `false` | Show VR overlay notifications           |
| `vrNotificationTimeout`      | Number  | `10`    | VR notification duration (3-60 seconds) |
| `announceViaIpc`             | Boolean | `false` | Broadcast updates to external apps      |

### Internal (Hidden)

| Setting                 | Type   | Default | Description                      |
| ----------------------- | ------ | ------- | -------------------------------- |
| `seenPlugins`           | String | `[]`    | JSON array of seen plugin IDs    |
| `lastCoreVersion`       | String | ``      | Last detected core version       |
| `dismissedCoreVersions` | String | `[]`    | JSON array of dismissed versions |

## How It Works

### Core Update Checking

1. Parses repository owner/name from `window.customjs.sourceUrl`
2. Fetches latest release from GitHub API
3. Compares `tag_name` with `window.customjs.build`
4. Shows confirmation dialog if newer version found
5. Opens release page in new tab if accepted
6. Prompts to reload VRCX after download
7. Respects dismissed versions list

### Plugin Update Checking

1. Iterates through all enabled repositories
2. Re-fetches repository data with `repo.fetch()`
3. Compares versions of loaded modules with repo versions
4. Detects new plugins not in `seenPlugins` list
5. Offers hot-reload for outdated plugins
6. Shows modal for new plugin discoveries

### Rate Limiting

- Extracts rate limit headers from GitHub API responses
- Warns when `remaining < 10`
- Supports personal access tokens for higher limits (5000 vs 60 req/hour)
- Shows detailed rate limit status on demand

## Usage Examples

### Manual Update Check

```javascript
// Get the plugin instance
const updateChecker = window.customjs.getModule("update-checker");

// Check for core updates
await updateChecker.checkCoreUpdate(true);

// Check for plugin updates
await updateChecker.checkPluginUpdates(true);

// Show rate limit status
updateChecker.showRateLimitStatus();
```

### Get Rate Limit Info

```javascript
const updateChecker = window.customjs.getModule("update-checker");
const rateLimitInfo = updateChecker.rateLimit;
console.log(rateLimitInfo);
// { limit: 60, remaining: 45, reset: 1234567890, used: 15 }
```

## User Workflow

### Core System Update

When a core system update is detected, you'll receive notifications across multiple channels (if enabled):

- 📱 **In-App** notification in VRCX
- 🪟 **Windows desktop** notification
- 🥽 **VR overlay** notification (XSOverlay/OVRToolkit)
- 📡 **IPC broadcast** to external apps

**Update steps:**

1. **Update dialog** appears with version info
2. Click **"View Release"** to start download
3. **Install path** is automatically copied to clipboard: `%APPDATA%\VRCX\custom.js`
4. **Instructions dialog** appears explaining the process
5. Click **"Start Download"** to begin
6. **Browser's "Save As" dialog** appears
7. **Paste** (Ctrl+V) the path into the **"File name:"** field
8. Click **"Save"** to overwrite the existing file
9. **Reload prompt** appears after download
10. Click **"Reload Now"** to apply the update immediately

### Plugin Update

When plugin updates are detected:

1. **Update dialog** shows list of outdated plugins
2. Click **"Update All"** or update individually
3. Plugins hot-reload automatically (no VRCX restart needed)

## GitHub Token Setup

To increase your API rate limit from 60 to 5000 requests/hour:

1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. No scopes needed (public repository access only)
4. Copy the token
5. Open Update Checker settings
6. Paste token in `githubToken` field

## Lifecycle

| Method    | Description                                                            |
| --------- | ---------------------------------------------------------------------- |
| `load()`  | Initializes settings, parses repository info, schedules startup checks |
| `start()` | Starts periodic update checking timers                                 |
| `stop()`  | Clears all update checking timers                                      |

## Implementation Details

### Multi-Channel Notifications

The plugin supports multiple notification channels:

| Channel    | API Method                   | When Used                         |
| ---------- | ---------------------------- | --------------------------------- |
| In-App     | `this.logger.showInfo()`     | Always                            |
| Desktop    | `AppApi.DesktopNotification` | When `enableDesktopNotifications` |
| XSOverlay  | `AppApi.XSNotification`      | When `enableVrNotifications`      |
| OVRToolkit | `AppApi.OVRTNotification`    | When `enableVrNotifications`      |
| IPC        | `AppApi.SendIpc`             | When `announceViaIpc`             |

### Authentication Store Integration

Subscribes to `$pinia.auth.$subscribe()` to detect login events and trigger update checks:

```typescript
$pinia.auth.$subscribe((mutation, state) => {
  if (state.isLoggedIn) {
    checkCoreUpdate(false);
  }
});
```

### Repository Info Parsing

Extracts owner/repo from `window.customjs.sourceUrl`:

```
https://github.com/vrcx-plugin-system/vrcx-plugin-system/...
                    ^^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^^^^^
                         owner              repo
```

### Version Comparison

Uses semantic versioning comparison:

- Splits versions by `.`
- Compares each segment numerically
- Returns: `-1` (older), `0` (equal), `1` (newer)

### Update Application

Plugin updates use `window.customjs.reloadModule(id)` for hot-reloading without VRCX restart.

## Advanced Features

### Automatic Download & Install

The plugin uses a multi-method download system to ensure compatibility:

**Download Methods** (tried in order):

1. **Fetch API + Blob** - Most reliable, works cross-origin
2. **Anchor Tag with `download` attribute** - Simple and effective
3. **Hidden iFrame** - Fallback for older browsers
4. **window.location** - Last resort

**Smart Path Management:**

- Automatically copies `%APPDATA%\VRCX\custom.js` to clipboard
- User pastes into browser's "Save As" dialog
- Ensures file is saved to correct location
- No manual path typing needed

### IPC Integration

When `announceViaIpc` is enabled, broadcasts update notifications to external apps:

**Core Update Message:**

```json
{
  "Type": "VrcxMessage",
  "MsgType": "UpdateAvailable",
  "Data": "{\"component\":\"plugin-system\",\"currentVersion\":12345,\"latestVersion\":\"12346\",\"releaseUrl\":\"...\"}"
}
```

**Plugin Update Message:**

```json
{
  "Type": "VrcxMessage",
  "MsgType": "PluginUpdates",
  "Data": "{\"count\":3,\"plugins\":[...]}"
}
```

### VR Integration

When in VR, updates are announced via:

- **XSOverlay**: UDP broadcast to `127.0.0.1:42069`
- **OVRToolkit**: WebSocket to `ws://127.0.0.1:11450/api`

Notifications appear as HUD and wrist overlays with configurable timeout.

## Troubleshooting

| Issue                        | Solution                                     |
| ---------------------------- | -------------------------------------------- |
| Rate limit errors            | Add GitHub token in settings                 |
| Updates not checking         | Check intervals in settings (min 5 minutes)  |
| Core repo not found          | Verify `window.customjs.sourceUrl` is set    |
| Plugin updates fail          | Check enabled repositories in Plugin Manager |
| Desktop notifications off    | Check Windows notification permissions       |
| VR notifications not working | Ensure XSOverlay/OVRToolkit is running       |
| IPC messages not received    | Check external app is listening on IPC       |
