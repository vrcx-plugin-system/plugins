# VRCX Plugins

TypeScript-based plugin repository for the VRCX Plugin System.

## Overview

This repository contains **30 plugins** for VRCX, all written in TypeScript and compiled to optimized JavaScript.

### Plugin Categories

| Category       | Count | Description                              |
| -------------- | ----- | ---------------------------------------- |
| **Core APIs**  | 4     | Foundation APIs other plugins depend on  |
| **Utilities**  | 8     | Tools and system enhancements            |
| **Social**     | 10    | User interaction and automation features |
| **Patches**    | 4     | System modifications and improvements    |
| **Test/Debug** | 4     | Development and testing utilities        |

## Quick Start

### Installation

```bash
cd vrcx-plugin-system/plugins
npm install
```

### Build All Plugins

```bash
npm run build
```

This compiles all TypeScript files to minified JavaScript in `dist/` and generates `repo.json`.

### Development Mode

```bash
npm run build:dev
```

Builds without minification for easier debugging.

## Project Structure

```
plugins/
├── src/
│   ├── plugins/          # All plugin TypeScript files
│   │   ├── *.ts          # Plugin source code
│   │   └── *.md          # Plugin documentation
│   └── types/
│       └── index.ts      # TypeScript type definitions
├── dist/                 # Build output (generated)
│   ├── *.js              # Compiled plugins
│   └── repo.json         # Repository metadata
├── build.js              # Main build script
├── build-repo.js         # Repository metadata generator
├── package.json          # NPM configuration
└── tsconfig.json         # TypeScript configuration
```

## Available Plugins

### Core API Plugins

| Plugin                                                      | ID                   | Description                      |
| ----------------------------------------------------------- | -------------------- | -------------------------------- |
| [Dialog API 💬](docs/plugins/dialog-api.md)                 | `dialog-api`         | Create and manage custom dialogs |
| [Navigation Menu API 🧭](docs/plugins/nav-menu-api.md)      | `nav-menu-api`       | Add custom navigation tabs       |
| [Context Menu API 📋](docs/plugins/context-menu-api.md)     | `context-menu-api`   | Add custom context menu items    |
| [Invite Message API ✉️](docs/plugins/invite-message-api.md) | `invite-message-api` | Manage invite messages           |

### Utility Plugins

| Plugin                                                    | ID                  | Description                         |
| --------------------------------------------------------- | ------------------- | ----------------------------------- |
| [Plugin Manager UI 🧩](docs/plugins/plugin-manager-ui.md) | `plugin-manager-ui` | Manage plugins via UI               |
| [Plugin Analyzer 🔍](docs/plugins/plugin-analyzer.md)     | `plugin-analyzer`   | Analyze plugin code and metadata    |
| [Update Checker 🔄](docs/plugins/update-checker.md)       | `update-checker`    | Check for system and plugin updates |
| [DevTools Button 🔧](docs/plugins/devtools-button.md)     | `devtools-button`   | Quick access to browser DevTools    |
| [Start Game Button 🎮](docs/plugins/start-game-button.md) | `start-game-button` | Launch VRChat from VRCX             |
| [API Retry Patch 🔄](docs/plugins/api-retry-patch.md)     | `api-retry-patch`   | Auto-retry failed API calls         |
| [Retry Auto Login 🔑](docs/plugins/retry-auto-login.md)   | `retry-auto-login`  | Auto-retry login on disconnect      |
| [VRCX Protocol Links 🔗](docs/plugins/protocol-links.md)  | `protocol-links`    | Copy VRChat protocol links          |

### Social Feature Plugins

| Plugin                                                                         | ID                           | Description                                |
| ------------------------------------------------------------------------------ | ---------------------------- | ------------------------------------------ |
| [Auto Follow 👥](docs/plugins/auto-follow.md)                                  | `auto-follow`                | Auto-request invites from users            |
| [Auto Invite 📨](docs/plugins/auto-invite.md)                                  | `auto-invite`                | Auto-invite users when you travel          |
| [Tag Manager 🏷️](docs/plugins/tag-manager.md)                                  | `tag-manager`                | Apply custom user tags                     |
| [Yoinker Detector 🚨](docs/plugins/yoinker-detector.md)                        | `yoinker-detector`           | Detect avatar rippers                      |
| [Avatar Logger 📸](docs/plugins/avatar-log.md)                                 | `avatar-log`                 | Submit avatars to databases                |
| [Bio Updater 📝](docs/plugins/bio-updater.md)                                  | `bio-updater`                | Auto-update your bio with templates        |
| [Bio Change Notifier 🔔](docs/plugins/bio-change-notifier.md)                  | `bio-change-notifier`        | Notify when friends change bio             |
| [Self Invite on Blocked Player 🚫](docs/plugins/selfinvite-onblockedplayer.md) | `selfinvite-onblockedplayer` | Create self-invite when blocked user joins |
| [Invisible Players Monitor 👻](docs/plugins/monitor-invisibleplayers.md)       | `monitor-invisibleplayers`   | Detect invisible/ghost players             |

### Patch Plugins

| Plugin                                                                        | ID                            | Description                      |
| ----------------------------------------------------------------------------- | ----------------------------- | -------------------------------- |
| [Bio Symbols Patch 🔤](docs/plugins/bio-symbols-patch.md)                     | `bio-symbols-patch`           | Preserve emojis in bios          |
| [User Badge Pipeline Patch 🎖️](docs/plugins/user-badge-pipeline-patch.md)     | `user-badge-pipeline-patch`   | Customize badge rendering        |
| [Registry Overrides ⚙️](docs/plugins/registry-overrides.md)                   | `registry-overrides`          | Manage VRChat registry keys      |
| [Auto Disable Untrusted URLs 🛡️](docs/plugins/auto-disable-untrusted-urls.md) | `auto-disable-untrusted-urls` | Security: disable untrusted URLs |

### Development/Test Plugins

| Plugin                                                | ID                | Description                          |
| ----------------------------------------------------- | ----------------- | ------------------------------------ |
| [Template Plugin 📄](docs/plugins/template.md)        | `template`        | Complete plugin development template |
| [Debug Plugin 🐛](docs/plugins/debug.md)              | `debug`           | Debugging utilities                  |
| [Logger Test 🧪](docs/plugins/logger-test.md)         | `logger-test`     | Test all logger methods              |
| [Dialog API Test 🧪](docs/plugins/dialog-api-test.md) | `dialog-api-test` | Test dialog-api features             |
| [Nav Menu Test 🧪](docs/plugins/nav-menu-test.md)     | `nav-menu-test`   | Test nav-menu-api features           |

## Creating a Plugin

### Method 1: Use the Template

1. Copy `src/plugins/template.ts`
2. Rename to your plugin name
3. Update metadata and dependencies
4. Implement your functionality
5. Build and test

### Method 2: Start from Scratch

1. Create `src/plugins/your-plugin.ts`
2. Extend `CustomModule`:

```typescript
class YourPlugin extends CustomModule {
  constructor() {
    super({
      name: "Your Plugin 🎯",
      description: "What your plugin does",
      authors: [
        {
          name: "Your Name",
          userId: "usr_xxx-xxx-xxx",
        },
      ],
      tags: ["Utility"],
      required_dependencies: [], // Optional
      optional_dependencies: [], // Optional
    });
  }

  async load() {
    // Initialize settings, load data
    this.loaded = true;
  }

  async start() {
    // Start functionality
    this.started = true;
  }

  async stop() {
    // Cleanup
    await super.stop();
  }
}

window.customjs.__LAST_PLUGIN_CLASS__ = YourPlugin;
```

3. Build: `npm run build`

## Plugin Features

### Settings System

```typescript
async load() {
  const SettingType = window.customjs.types.SettingType;

  this.settings = this.defineSettings({
    myOption: {
      type: SettingType.BOOLEAN,
      description: 'Enable my feature',
      default: true,
      min: 0,              // For numbers/timespans
      max: 100,            // For numbers/timespans
      category: 'general'  // Optional grouping
    }
  });
}
```

### Action Buttons

```typescript
constructor() {
  super({...});

  this.actionButtons = [
    {
      title: 'Do Something',
      color: 'primary',
      icon: 'ri-star-line',
      description: 'Performs an action',
      callback: async () => {
        await this.doSomething();
      }
    }
  ];
}
```

### Helper Methods

All plugins inherit from `CustomModule`:

| Method                   | Purpose                           |
| ------------------------ | --------------------------------- |
| `showConfirmDialog()`    | Show confirmation with fallback   |
| `showAlertDialog()`      | Show alert with fallback          |
| `registerTimer()`        | Auto-cleanup timers               |
| `registerListener()`     | Auto-cleanup event listeners      |
| `registerObserver()`     | Auto-cleanup observers            |
| `registerSubscription()` | Auto-cleanup subscriptions        |
| `emit()`                 | Publish events                    |
| `subscribe()`            | Subscribe to events               |
| `registerPreHook()`      | Intercept function calls (before) |
| `registerPostHook()`     | Intercept function calls (after)  |

## Build Process

### Step 1: TypeScript Compilation

- Uses esbuild for fast compilation
- Target: ES2020
- Minification: Production mode only
- Source maps: Disabled for size

### Step 2: Repository Generation

Scans compiled plugins and generates `repo.json`:

```json
{
  "name": "VRCX Plugin Repository",
  "description": "Official VRCX plugins",
  "authors": [...],
  "modules": [
    {
      "id": "plugin-id",
      "name": "Plugin Name",
      "description": "...",
      "url": "https://github.com/.../plugin-id.js",
      "sourceUrl": "https://github.com/.../plugin-id.ts",
      "enabled": true,
      "tags": [...]
    }
  ]
}
```

### Build Output

```
✓ plugin-name.ts → plugin-name.js (23.58KB → 10.92KB)
✓ Success: 30
📊 Total modules: 30
```

## Type Definitions

### CustomModule Interface

See `src/types/index.ts` for complete type definitions including:

- `ModuleMetadata` - Plugin metadata structure
- `SettingDefinition` - Setting configuration
- `CustomActionButton` - Action button interface
- `ModuleLogger` - Logging interface
- `ModuleResources` - Resource tracking

## Testing

Each plugin should be tested:

1. Load in VRCX
2. Verify settings appear
3. Test action buttons
4. Check console for errors
5. Verify cleanup on disable

## Documentation

Each plugin has a corresponding `.md` file in `src/plugins/` with:

- Overview and features
- Settings reference
- Usage examples
- Implementation details
- Troubleshooting guide

## Dependencies

### Required Dependencies

Must be loaded and started before dependent plugin starts:

```typescript
required_dependencies: ["dialog-api"];
```

### Optional Dependencies

Plugin works without them, but may have reduced functionality:

```typescript
optional_dependencies: ["plugin-analyzer"];
```

## Best Practices

1. **Use TypeScript** - Full type safety and IDE support
2. **Document thoroughly** - Create comprehensive `.md` file
3. **Handle errors** - Always wrap risky operations in try-catch
4. **Clean up resources** - Use register methods for auto-cleanup
5. **Test extensively** - Enable, disable, reload multiple times
6. **Check dependencies** - Verify required plugins are available
7. **Log appropriately** - Use console for debugging, notifications for users
8. **Follow naming** - Use kebab-case for IDs, Title Case for names
9. **Include emojis** - Makes plugins visually distinct
10. **Export class** - Always set `window.customjs.__LAST_PLUGIN_CLASS__`

## Contributing

1. Fork this repository
2. Create your plugin following the template
3. Test thoroughly
4. Create documentation
5. Submit pull request

## Links

- **Core System**: https://github.com/vrcx-plugin-system/vrcx-plugin-system
- **Plugin Repository**: https://github.com/vrcx-plugin-system/plugins
- **VRCX**: https://github.com/vrcx-team/VRCX

## License

MIT
