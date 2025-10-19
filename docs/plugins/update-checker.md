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

| Button                      | Description                            |
| --------------------------- | -------------------------------------- |
| **Check Core Updates**      | Manually check for core system updates |
| **Check Plugin Updates**    | Manually check for plugin updates      |
| **Show Rate Limit Status**  | Display current GitHub API rate limit  |
| **Reset Dismissed Updates** | Clear dismissed update notifications   |

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
5. Respects dismissed versions list

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

## Troubleshooting

| Issue                | Solution                                     |
| -------------------- | -------------------------------------------- |
| Rate limit errors    | Add GitHub token in settings                 |
| Updates not checking | Check intervals in settings (min 5 minutes)  |
| Core repo not found  | Verify `window.customjs.sourceUrl` is set    |
| Plugin updates fail  | Check enabled repositories in Plugin Manager |

## Version History

- **v1.0** - Initial release with core and plugin update checking
