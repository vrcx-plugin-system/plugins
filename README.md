# VRCX Plugins

Official plugin collection for [VRCX Plugin System](https://github.com/vrcx-plugin-system/vrcx-plugin-system).

## Overview

Plugins extend VRCX functionality without core modifications. They're plain JavaScript files loaded remotely at runtime, manageable through the Plugin Manager UI.

## Plugin List

### 🔧 Core APIs

| Plugin                 | Description                                       |
| ---------------------- | ------------------------------------------------- |
| **nav-menu-api**       | Add custom navigation menu items                  |
| **context-menu-api**   | Add custom context menu items (user/world/avatar) |
| **invite-message-api** | Manage rotating invite messages with variables    |

### 🎨 UI & Management

| Plugin                | Description                               |
| --------------------- | ----------------------------------------- |
| **plugin-manager-ui** | Visual plugin manager (Equicord-inspired) |
| **protocol-links**    | Copy `vrcx://` protocol links             |
| **tag-manager**       | Load custom user tags from URLs           |

### 🤖 Automation

| Plugin          | Description                            |
| --------------- | -------------------------------------- |
| **auto-invite** | Auto-invite users when changing worlds |
| **auto-follow** | Auto-request invites when users move   |
| **bio-updater** | Auto-update bio with stats & templates |

### 🛡️ Security & Safety

| Plugin                          | Description                            |
| ------------------------------- | -------------------------------------- |
| **yoinker-detector**            | Check users against detection database |
| **auto-disable-untrusted-urls** | Block untrusted plugin URLs            |
| **selfinvite-onblockedplayer**  | Auto-escape when blocked players join  |

### 📊 Monitoring & Logging

| Plugin                       | Description                              |
| ---------------------------- | ---------------------------------------- |
| **avatar-log**               | Log & submit avatar IDs to databases     |
| **monitor-invisibleplayers** | Detect invisible players in instance     |
| **debug**                    | Debug utilities & IPC logging (dev tool) |

### ⚙️ System

| Plugin                 | Description                         |
| ---------------------- | ----------------------------------- |
| **registry-overrides** | VRChat registry settings management |
| **start-game-button**  | Quick launch VRChat button          |

### 📝 Development

| Plugin       | Description                                 |
| ------------ | ------------------------------------------- |
| **template** | Complete plugin example with best practices |

## Quick Usage

### Via Plugin Manager UI

1. Open VRCX
2. Click **"Plugins"** in navigation
3. Enable/disable plugins with toggle switches
4. Click ⚙️ to configure settings
5. Click 🔍 to analyze plugin code

### Via Console

```javascript
// Get plugin
const plugin = window.customjs.pluginManager.getPlugin("plugin-id");

// Enable/disable
await plugin.toggle();

// View settings
plugin.getAllSettings();

// Modify setting
plugin.set("settingKey", value);
```

## Plugin Development

### Minimal Example

```javascript
class MyPlugin extends window.customjs.Plugin {
  constructor() {
    super({
      name: "My Plugin",
      description: "What it does",
      author: "Your Name",
      version: "1.0.0",
    });
  }

  async load() {
    // Setup: define settings, register hooks
  }

  async start() {
    // Start: timers, DOM modifications
  }
}

window.customjs.__LAST_PLUGIN_CLASS__ = MyPlugin;
```

### Custom Action Buttons

Add buttons to Plugin Manager cards:

```javascript
getActionButtons() {
  return [
    {
      label: "Clear Cache",
      color: "danger",
      icon: "ri-delete-bin-line",
      title: "Clear all cached data",
      callback: async () => {
        this.clearCache();
        this.logger.showSuccess("Cache cleared!");
      },
    },
  ];
}
```

**Colors**: `primary`, `success`, `warning`, `danger`, `info`  
**Icons**: [Remix Icon](https://remixicon.com/) classes (e.g., `ri-refresh-line`)

### Settings with Variables

Template settings can define variables for user reference:

```javascript
this.defineSettings({
  template: {
    type: SettingType.STRING,
    description: "Bio template",
    default: "Friends: {friends}\nPlaytime: {playtime}",
    variables: {
      "{friends}": "Friend count",
      "{playtime}": "Total playtime",
    },
  },
});
```

Variables display under the setting with copy-to-clipboard.

### Resource Management

Auto-cleanup when plugin stops:

```javascript
// Timers
this.registerTimer(setInterval(() => {}, 1000));

// Event listeners
this.registerListener(element, "click", handler);

// Observers
this.registerObserver(mutationObserver);
```

### Logging

```javascript
// Console only
this.log("Message");
this.warn("Warning");
this.error("Error");

// VRCX UI
this.logger.showInfo("Info toast");
this.logger.showSuccess("Success!");
this.logger.showWarning("Warning");
this.logger.showError("Error");

// Desktop/VR
this.logger.notifyDesktop("Desktop notification");
this.logger.notifyVR("VR overlay notification");

// Add to VRCX logs
this.logger.addFeed({
  /* feed entry */
});
this.logger.addGameLog({
  /* game log entry */
});
```

### Hook System

```javascript
// Pre-hook (before function runs)
this.registerPreHook("AppApi.SendIpc", (args) => {
  console.log("IPC args:", args);
});

// Post-hook (after function runs)
this.registerPostHook("$app.playNoty", (result, args) => {
  console.log("Result:", result);
});

// Void-hook (block function)
this.registerVoidHook("annoyingFunc", () => {
  console.log("Blocked");
});

// Replace-hook (custom implementation)
this.registerReplaceHook("func", (original, ...args) => {
  return original(...args) + " modified";
});
```

## Plugin URLs

All plugins load from:

```
https://github.com/vrcx-plugin-system/plugins/raw/refs/heads/main/{plugin-name}.js
```

## Documentation

- **[Plugin Development Guide](https://github.com/vrcx-plugin-system/vrcx-plugin-system/blob/main/docs/plugins.md)**
- **[API Reference](https://github.com/vrcx-plugin-system/vrcx-plugin-system/blob/main/docs/api-reference.md)**

## Contributing

1. Fork this repository
2. Create plugin following `template.js`
3. Test thoroughly
4. Submit pull request with:
   - Plugin file
   - Description
   - Dependencies (if any)

## Support

- **Issues**: [GitHub Issues](https://github.com/vrcx-plugin-system/plugins/issues)
- **Core System**: [vrcx-plugin-system](https://github.com/vrcx-plugin-system/vrcx-plugin-system)

## License

MIT License
