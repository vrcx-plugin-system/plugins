# VRCX Plugins Repository

Official plugin collection for [VRCX Plugin System v3.0](https://github.com/vrcx-plugin-system/vrcx-plugin-system).

## Overview

This repository contains plugins for the VRCX Plugin System. Plugins are plain JavaScript files that extend VRCX functionality without requiring core system modifications. They are loaded remotely at runtime and can be enabled/disabled through the Plugin Manager UI.

## Quick Start

### Installation

Plugins are automatically loaded if listed in the core system's default configuration. To manually enable a plugin:

1. Open VRCX
2. Use the **Plugin Manager UI** to enable/disable plugins
3. Or manually edit your plugin configuration via console

### Using Plugin Manager UI

The easiest way to manage plugins is through the Plugin Manager UI plugin:

```javascript
// Access Plugin Manager in VRCX
window.customjs.pluginManager.getPlugin("plugin-manager-ui");
```

## Plugin List

### Core Plugins (APIs & Infrastructure)

| Plugin                                          | Description                                          | Auto-Enabled | Dependencies |
| ----------------------------------------------- | ---------------------------------------------------- | ------------ | ------------ |
| **[Context Menu API](#context-menu-api)**       | Custom context menu management for VRCX dialogs      | ✅ Yes       | None         |
| **[Navigation Menu API](#navigation-menu-api)** | API for adding custom navigation menu items          | ✅ Yes       | None         |
| **[Invite Message API](#invite-message-api)**   | API for managing and rotating custom invite messages | ✅ Yes       | None         |
| **[Config Proxy](#config-proxy)**               | Configuration management proxy for plugins           | ✅ Yes       | None         |

### User Interface Plugins

| Plugin                                      | Description                                         | Auto-Enabled | Dependencies     |
| ------------------------------------------- | --------------------------------------------------- | ------------ | ---------------- |
| **[Plugin Manager UI](#plugin-manager-ui)** | Visual UI for managing plugins (Equicord-inspired)  | ✅ Yes       | Nav Menu API     |
| **[Protocol Links](#protocol-links)**       | Copy VRCX protocol links for users, avatars, worlds | ✅ Yes       | Context Menu API |
| **[Tag Manager](#tag-manager)**             | Custom user tags management with URL-based loading  | ✅ Yes       | None             |

### Automation Plugins

| Plugin                                          | Description                                      | Auto-Enabled | Dependencies     |
| ----------------------------------------------- | ------------------------------------------------ | ------------ | ---------------- |
| **[Auto Invite Manager](#auto-invite-manager)** | Automatic user invitation with location tracking | ✅ Yes       | Context Menu API |
| **[Auto Follow Manager](#auto-follow-manager)** | Automatic location tracking for selected users   | ✅ Yes       | Context Menu API |
| **[Bio Updater](#bio-updater)**                 | Automatic bio updating with statistics           | ❌ No        | None             |

### Security & Safety Plugins

| Plugin                                                              | Description                                     | Auto-Enabled | Dependencies |
| ------------------------------------------------------------------- | ----------------------------------------------- | ------------ | ------------ |
| **[Yoinker Detector](#yoinker-detector)**                           | Checks users against yoinker detection database | ✅ Yes       | None         |
| **[Auto Disable Untrusted URLs](#auto-disable-untrusted-urls)**     | Blocks untrusted URLs from loading              | ✅ Yes       | None         |
| **[Self Invite on Blocked Player](#self-invite-on-blocked-player)** | Auto-escapes when blocked players join          | ❌ No        | None         |

### Monitoring & Logging Plugins

| Plugin                                                      | Description                              | Auto-Enabled | Dependencies |
| ----------------------------------------------------------- | ---------------------------------------- | ------------ | ------------ |
| **[Avatar Log](#avatar-log)**                               | Logs and submits avatar IDs to databases | ✅ Yes       | None         |
| **[Invisible Players Monitor](#invisible-players-monitor)** | Detects potentially invisible players    | ❌ No        | None         |
| **[Debug Plugin](#debug-plugin)**                           | Debug utilities and IPC logging          | ❌ No        | None         |

### System Plugins

| Plugin                                        | Description                         | Auto-Enabled | Dependencies |
| --------------------------------------------- | ----------------------------------- | ------------ | ------------ |
| **[Registry Overrides](#registry-overrides)** | VRChat registry settings management | ❌ No        | None         |

### Development

| Plugin                                  | Description                               | Auto-Enabled | Dependencies |
| --------------------------------------- | ----------------------------------------- | ------------ | ------------ |
| **[Template Plugin](#template-plugin)** | Example plugin demonstrating all features | ❌ No        | None         |

---

## Plugin Details

### Core Plugins

#### Context Menu API

**File**: `context-menu-api.js`  
**Auto-Enabled**: Yes  
**Dependencies**: None

Custom context menu management for VRCX dialogs. Provides an API for other plugins to register custom menu items that appear in user/world/avatar context menus.

**Features**:

- Register custom context menu items
- Support for user, world, avatar contexts
- Dynamic menu item generation
- Priority-based ordering
- Icon support

**Usage** (by other plugins):

```javascript
const contextMenuApi = await window.customjs.pluginManager.waitForPlugin(
  "context-menu-api"
);
contextMenuApi.registerMenuItem({
  context: "user",
  label: "My Custom Action",
  icon: "🔧",
  onClick: (userId) => {
    console.log("Action triggered for:", userId);
  },
});
```

---

#### Navigation Menu API

**File**: `nav-menu-api.js`  
**Auto-Enabled**: Yes  
**Dependencies**: None

API for adding custom navigation menu items to VRCX's main navigation.

**Features**:

- Add custom menu items to VRCX navigation
- Support for icons and badges
- Click handlers
- Active state management
- Menu item removal

**Usage** (by other plugins):

```javascript
const navMenuApi = await window.customjs.pluginManager.waitForPlugin(
  "nav-menu-api"
);
navMenuApi.addMenuItem({
  id: "my-custom-page",
  label: "My Plugin",
  icon: "🎨",
  onClick: () => {
    // Show custom UI
  },
});
```

---

#### Invite Message API

**File**: `invite-message-api.js`  
**Auto-Enabled**: Yes  
**Dependencies**: None

API for managing and rotating custom invite messages with cooldown tracking.

**Features**:

- Multiple invite message templates
- Message rotation with cooldowns
- Variable substitution (`{userName}`, `{worldName}`, etc.)
- Message usage tracking
- Per-user message history

**Usage** (by other plugins):

```javascript
const inviteApi = await window.customjs.pluginManager.waitForPlugin(
  "invite-message-api"
);
const message = inviteApi.getNextMessage({
  userName: "John",
  worldName: "My World",
});
```

---

#### Config Proxy

**File**: `config-proxy.js`  
**Auto-Enabled**: Yes  
**Dependencies**: None

Configuration management proxy for plugins. Provides a centralized way to manage plugin configurations with validation and change tracking.

**Features**:

- Configuration validation
- Change event notifications
- Default value management
- Type checking
- Nested configuration support

---

### User Interface Plugins

#### Plugin Manager UI

**File**: `plugin-manager-ui.js`  
**Auto-Enabled**: Yes  
**Dependencies**: Navigation Menu API

Visual UI for managing VRCX custom plugins, inspired by Equicord's plugin manager design.

**Features**:

- Enable/disable plugins with toggle switches
- Search and filter plugins
- View plugin metadata (name, version, author, description)
- Configure plugin settings
- Check for plugin updates
- View plugin load status and errors
- Beautiful card-based layout

**Access**:

- Click "Plugins" in VRCX navigation menu
- Or via console: `window.customjs.pluginManager.getPlugin("plugin-manager-ui")`

---

#### Protocol Links

**File**: `protocol-links.js`  
**Auto-Enabled**: Yes  
**Dependencies**: Context Menu API

Adds context menu items to copy VRCX protocol links for users, avatars, worlds, groups, and instances.

**Features**:

- Copy `vrcx://user/{userId}` links
- Copy `vrcx://avatar/{avatarId}` links
- Copy `vrcx://world/{worldId}` links
- Copy `vrcx://instance/{instanceId}` links
- Automatic clipboard copying
- Toast notifications on copy

**Usage**:
Right-click any user, world, or avatar in VRCX → "Copy Protocol Link"

---

#### Tag Manager

**File**: `tag-manager.js`  
**Auto-Enabled**: Yes  
**Dependencies**: None

Custom user tags management with URL-based loading. Load user tags from remote URLs and apply them automatically.

**Features**:

- Load tags from multiple URL sources
- Automatic tag synchronization
- Periodic tag updates
- Tag color customization
- Notification on tagged player join
- Configurable update intervals

**Settings**:

- `tagUrls`: Array of URLs to load tags from
- `updateInterval`: How often to reload tags (ms)
- `initialDelay`: Delay before first load (ms)
- `notifyOnJoin`: Show notification when tagged player joins

---

### Automation Plugins

#### Auto Invite Manager

**File**: `auto-invite.js`  
**Auto-Enabled**: Yes  
**Dependencies**: Context Menu API

Automatic user invitation system with location tracking and custom messages.

**Features**:

- Right-click users to enable auto-invite
- Automatically invite selected users to your location
- Track user locations
- Custom invite messages with variables
- Smart invite cooldowns
- Multi-user support

**Usage**:

1. Right-click a user in VRCX
2. Select "Enable Auto-Invite"
3. Plugin will automatically invite them when you change locations

**Settings**:

- `inviteMessage`: Custom message template (supports `{userName}`, `{worldName}`)

---

#### Auto Follow Manager

**File**: `auto-follow.js`  
**Auto-Enabled**: Yes  
**Dependencies**: Context Menu API

Automatic location tracking system that follows selected users.

**Features**:

- Right-click users to enable auto-follow
- Automatically request invites when followed user changes location
- Track multiple users simultaneously
- Custom request messages
- Cooldown management
- Follow status indicators

**Usage**:

1. Right-click a user in VRCX
2. Select "Enable Auto-Follow"
3. Plugin will automatically request invites when they move

**Settings**:

- `requestMessage`: Message sent when requesting invite

---

#### Bio Updater

**File**: `bio-updater.js`  
**Auto-Enabled**: No (manual enable required)  
**Dependencies**: None

Automatic bio updating with user statistics and custom templates.

**Features**:

- Template-based bio generation
- Variable substitution (`{playtime}`, `{friendCount}`, `{level}`, etc.)
- Steam integration for playtime tracking
- Configurable update intervals
- Automatic updates on login

**Settings**:

- `updateInterval`: Update frequency (default: 2 hours)
- `steamId64`: Your Steam ID for playtime tracking
- `bioTemplate`: Custom bio template with variables

**Example Template**:

```
🎮 VRChat Player
⏱️ Playtime: {playtime} hours
👥 Friends: {friendCount}
🏆 Trust: {trustLevel}
```

---

### Security & Safety Plugins

#### Yoinker Detector

**File**: `yoinker-detector.js`  
**Auto-Enabled**: Yes  
**Dependencies**: None

Automatically checks users against yoinker detection database and applies tags + notifications.

**Features**:

- Automatic user checking on profile open / instance join
- Desktop and VR notifications
- Automatic tagging of detected yoinkers
- Configurable tag name and color
- Result caching to reduce API calls
- Statistics tracking

**Settings**:

- `enabled`: Enable/disable detection
- `checkOnProfileOpen`: Check when viewing profiles
- `checkOnInstanceJoin`: Check users joining your instance
- `desktopNotify`: Show desktop notifications
- `vrNotify`: Show VR overlay notifications
- `autoTag`: Automatically tag detected users
- `tagName`: Name of the tag to apply
- `tagColor`: Color of the tag (hex format)
- `cacheExpiry`: Cache duration in minutes

**API Endpoint**: Configurable via `apiEndpoint` setting

---

#### Auto Disable Untrusted URLs

**File**: `auto-disable-untrusted-urls.js`  
**Auto-Enabled**: Yes  
**Dependencies**: None

Automatically disables plugins loaded from untrusted/unknown URLs for security.

**Features**:

- Whitelist-based URL validation
- Automatic plugin disabling
- Warning notifications
- Configurable trusted domains
- Protects against malicious plugins

---

#### Self Invite on Blocked Player

**File**: `selfinvite-onblockedplayer.js`  
**Auto-Enabled**: No  
**Dependencies**: None

Automatically creates a self-invite to a new instance when a blocked player joins your current instance.

**Features**:

- Automatic detection of blocked players
- Creates self-invite to escape
- Configurable delay before invite
- Cooldown between invites
- Optional notifications
- Privacy option for notification content

**Settings**:

- `enabled`: Enable auto-escape feature
- `delay`: Delay before creating invite (ms)
- `cooldown`: Minimum time between invites (ms)
- `notify`: Show notification when escaping
- `includePlayerName`: Include blocked player's name in notification

---

### Monitoring & Logging Plugins

#### Avatar Log

**File**: `avatar-log.js`  
**Auto-Enabled**: Yes  
**Dependencies**: None

Automatically logs and submits avatar IDs to various avatar database providers.

**Features**:

- Automatic avatar ID capture from VRCX logs
- Submit to multiple databases simultaneously
- Configurable submission endpoints
- Rate limiting and cooldowns
- Statistics tracking
- Error handling and retry logic

**Supported Databases**:

- Custom API endpoints (configurable)
- Compatible with VRC-LOG style databases

**Settings**:
See [avatar-log.README.md](avatar-log.README.md) for detailed configuration.

---

#### Invisible Players Monitor

**File**: `monitor-invisibleplayers.js`  
**Auto-Enabled**: No  
**Dependencies**: None

Detects and notifies when potentially invisible players are in your instance.

**Features**:

- Detects players not rendered in game
- Shows invisible player count
- Optional instance name modification
- Configurable notifications
- Change-based alerts (only notify on count change)

**Settings**:

- `enabled`: Enable invisible player detection
- `modifyInstanceName`: Add count to instance display
- `showNotification`: Show notification on detection
- `notifyOnChange`: Only notify when count changes

**Detection Method**: Compares VRCX player list with in-game rendered players

---

#### Debug Plugin

**File**: `debug.js`  
**Auto-Enabled**: No (for developers)  
**Dependencies**: None

Debug utilities, IPC logging, global scope search, and console commands for development.

**Features**:

- IPC message logging and interception
- Global scope object search
- Plugin introspection commands
- Event bus monitoring
- Performance profiling
- Console command shortcuts

**Console Commands**:

```javascript
// List all plugins
customjs.plugins;

// Get plugin info
customjs.pluginManager.getPlugin("plugin-id");

// Search global scope
debug.search("keyword");

// View IPC logs
debug.getIpcLogs();
```

---

### System Plugins

#### Registry Overrides

**File**: `registry-overrides.js`  
**Auto-Enabled**: No (requires manual configuration)  
**Dependencies**: None

VRChat registry settings management with event-based triggers.

**⚠️ Warning**: This plugin modifies Windows registry settings. Use with caution.

**Features**:

- Override VRChat registry settings
- Event-based triggers (onLogin, onLocationChange, etc.)
- Automatic application on events
- Configurable registry keys and values
- Backup and restore functionality

**Settings**:

- `enabled`: Master enable switch
- `overrides`: Dictionary of registry overrides with triggers

**Example Configuration**:

```javascript
{
  "HKEY_CURRENT_USER\\Software\\VRChat\\VRChat": {
    "value": "someValue",
    "trigger": "onLogin"
  }
}
```

---

### Development

#### Template Plugin

**File**: `template.js`  
**Auto-Enabled**: No (for reference)  
**Dependencies**: None

Example plugin demonstrating all available features and lifecycle events. Use this as a starting point for creating new plugins.

**Demonstrates**:

- Plugin lifecycle methods (`load`, `start`, `onLogin`, `stop`)
- Resource management (timers, listeners, observers)
- Settings system (Equicord-style)
- Hook system (pre/post/void/replace hooks)
- Event system (emit/subscribe)
- Logger usage
- VRCX event subscriptions
- UI creation
- Best practices

**Usage**:
Copy `template.js` as a starting point for your own plugin. See inline comments for detailed explanations.

---

## Plugin Development

### Creating a New Plugin

1. **Copy the template**:

   ```bash
   cp template.js my-plugin.js
   ```

2. **Update metadata**:

   ```javascript
   super({
     name: "My Plugin",
     description: "What my plugin does",
     author: "Your Name",
     version: "1.0.0",
   });
   ```

3. **Implement lifecycle methods**:

   - `load()`: Initial setup, register hooks
   - `start()`: Start timers, modify DOM
   - `onLogin()`: User-specific initialization
   - `stop()`: Cleanup

4. **Export your plugin**:
   ```javascript
   window.customjs.__LAST_PLUGIN_CLASS__ = MyPlugin;
   ```

### Documentation

- **[Plugin Development Guide](https://github.com/vrcx-plugin-system/vrcx-plugin-system/blob/main/docs/plugins.md)**
- **[API Reference](https://github.com/vrcx-plugin-system/vrcx-plugin-system/blob/main/docs/api-reference.md)**
- **[Migration Guide](https://github.com/vrcx-plugin-system/vrcx-plugin-system/blob/main/MIGRATION-GUIDE.md)**

### Plugin API

All plugins extend the `window.customjs.Plugin` base class which provides:

- **Resource Management**: Auto-cleanup of timers, listeners, observers
- **Hook System**: Intercept and modify function calls
- **Event System**: Emit and subscribe to events
- **Settings System**: Equicord-inspired settings with reactive updates
- **Logging**: Multiple output targets (console, UI, VR, desktop)
- **VRCX Events**: Subscribe to location, user, game state changes

See the [API Reference](https://github.com/vrcx-plugin-system/vrcx-plugin-system/blob/main/docs/api-reference.md) for complete documentation.

---

## Plugin URLs

All plugins are loaded from this repository via GitHub raw URLs:

```
https://raw.githubusercontent.com/vrcx-plugin-system/plugins/main/{plugin-name}.js
```

### Example URLs

- Context Menu API: `https://raw.githubusercontent.com/vrcx-plugin-system/plugins/main/context-menu-api.js`
- Plugin Manager UI: `https://raw.githubusercontent.com/vrcx-plugin-system/plugins/main/plugin-manager-ui.js`
- Auto Invite: `https://raw.githubusercontent.com/vrcx-plugin-system/plugins/main/auto-invite.js`

---

## Configuration

### Enable/Disable Plugins

**Via Plugin Manager UI** (Recommended):

1. Open VRCX
2. Click "Plugins" in navigation
3. Toggle plugins on/off

**Via Console**:

```javascript
// Get current config
const config = window.customjs.configManager.getPluginConfig();

// Enable a plugin
config[
  "https://raw.githubusercontent.com/vrcx-plugin-system/plugins/main/my-plugin.js"
] = true;

// Disable a plugin
config[
  "https://raw.githubusercontent.com/vrcx-plugin-system/plugins/main/my-plugin.js"
] = false;

// Save config
window.customjs.configManager.setPluginConfig(config);
```

### Plugin Settings

Each plugin may have its own settings accessible via:

```javascript
// Get plugin instance
const plugin = window.customjs.pluginManager.getPlugin("plugin-id");

// View settings
console.log(plugin.getAllSettings());

// Modify settings
plugin.set("settingKey", newValue);
```

---

## Contributing

We welcome plugin contributions! To submit a plugin:

1. Fork this repository
2. Create your plugin following the template
3. Test thoroughly
4. Submit a pull request with:
   - Plugin file
   - README section addition (optional)
   - Description of features
   - Any dependencies

### Contribution Guidelines

- Follow existing code style
- Use JSDoc comments for type hints
- Implement proper resource cleanup
- Handle errors gracefully
- Test with multiple VRCX versions
- Document all settings and features

---

## Support

- **Issues**: [GitHub Issues](https://github.com/vrcx-plugin-system/plugins/issues)
- **Core System**: [vrcx-plugin-system/vrcx-plugin-system](https://github.com/vrcx-plugin-system/vrcx-plugin-system)
- **VRCX**: [vrcx-team/VRCX](https://github.com/vrcx-team/VRCX)

---

## License

See [LICENSE](LICENSE) file for details.

---

## Credits

- **VRCX Team**: For creating VRCX
- **Plugin Developers**: Community contributors
- **Equicord**: Inspiration for settings system and UI design

---

**Total Plugins**: 19  
**Auto-Enabled**: 12  
**Manual Enable**: 7  
**Last Updated**: 2024-01-15
