# Plugin Manager UI 🧩

Comprehensive UI for managing plugins, repositories, and settings in VRCX.

## Overview

| Property                  | Value                           |
| ------------------------- | ------------------------------- |
| **ID**                    | `plugin-manager-ui`             |
| **Category**              | Core Utility                    |
| **Tags**                  | UI, Management, Plugin, Core    |
| **Required Dependencies** | `nav-menu-api`, `dialog-api`    |
| **Optional Dependencies** | `plugin-analyzer`               |
| **Author**                | Bluscream                       |

## Features

- ✅ Visual plugin grid with search and filtering
- ✅ Enable/disable plugins with toggle
- ✅ Reload plugins without VRCX restart
- ✅ Remove plugins
- ✅ Install plugins from URLs
- ✅ Repository management (add, remove, refresh)
- ✅ Plugin settings UI with categories
- ✅ Configuration import/export
- ✅ Plugin analysis integration
- ✅ Statistics dashboard
- ✅ Action buttons for each plugin
- ✅ Real-time status updates

## Main Sections

### Plugin Grid

Displays all available plugins with:
- **Status indicators**: Enabled (green), Disabled (gray), Failed (red)
- **Action buttons**: Enable/Disable, Reload, Settings, Info, Analyze, Remove
- **Search**: Filter by name/description/tags
- **Filters**: All, Enabled, Disabled, Core Modules, Failed

### Repository Management

| Action   | Description                          |
| -------- | ------------------------------------ |
| Add      | Add new plugin repository by URL     |
| Remove   | Remove repository from list          |
| Refresh  | Re-fetch repository data             |
| Toggle   | Enable/disable repository            |

### Configuration Sync

| Action | Description                                |
| ------ | ------------------------------------------ |
| Import | Import plugin configuration from JSON file |
| Export | Export current configuration to JSON file  |

### Statistics

Real-time counts of:
- Total modules loaded
- Core modules
- Enabled plugins
- Failed modules

## Action Buttons

Each plugin card shows action buttons based on state:

| Button     | Icon                   | Description                        |
| ---------- | ---------------------- | ---------------------------------- |
| Enable     | ✓                      | Enable and start the plugin        |
| Disable    | –                      | Disable and stop the plugin        |
| Reload     | ri-restart-line        | Reload plugin from URL             |
| Settings   | ri-settings-3-line     | Open settings modal (if available) |
| Info       | ri-information-line    | Show plugin metadata               |
| Analyze    | ri-search-line         | Analyze plugin code (if available) |
| Remove     | ri-delete-bin-line     | Remove plugin from system          |

## Settings Modal

When a plugin has settings, the settings modal displays:

### Features

- **Categorized settings** - Groups settings by category
- **Live updates** - Changes apply immediately
- **Type-specific inputs**:
  - Boolean: Toggle switches
  - String: Text inputs with placeholders
  - Number: Number inputs
  - Select: Dropdown menus
  - Slider: Range sliders with markers
  - Timespan: Human-readable time inputs
- **Reset button** - Revert all settings to defaults
- **Variable hints** - Shows available template variables

### Timespan Input Format

Accepts human-readable formats:
- `5s`, `30s` - Seconds
- `5m`, `30m` - Minutes
- `2h`, `12h` - Hours
- `1d`, `7d` - Days
- Mixed: `1h 30m`, `2d 6h`

## Usage Examples

### Access Plugin Manager

```javascript
const pluginManager = window.customjs.getModule('plugin-manager-ui');

// Refresh the plugin grid
pluginManager.refreshPluginGrid();
```

### Install Plugin Programmatically

```javascript
const pluginUrl = 'https://example.com/my-plugin.js';
await pluginManager.handleInstallPlugin(pluginUrl);
```

### Export Configuration

```javascript
const pluginManager = window.customjs.getModule('plugin-manager-ui');
const config = window.customjs.configManager.getPluginConfig();

// Export to file
const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'vrcx-plugins-config.json';
a.click();
```

## Repository Configuration Format

```json
{
  "repositories": [
    {
      "url": "https://github.com/vrcx-plugin-system/plugins/raw/refs/heads/main/dist/repo.json",
      "enabled": true
    }
  ]
}
```

## Plugin Configuration Format

```json
{
  "https://github.com/.../plugin1.js": true,
  "https://github.com/.../plugin2.js": false,
  "plugin-id.setting1": "value1",
  "plugin-id.setting2": true
}
```

## Implementation Details

### Grid Rendering

- Creates card for each plugin
- Shows metadata (name, description, author, tags)
- Displays current status with color coding
- Renders action buttons based on plugin state

### Settings Rendering

- Reads `plugin.settings.def` for setting definitions
- Groups by category if `plugin.categories` exists
- Creates appropriate input for each setting type
- Binds two-way data binding to `plugin.settings.store`

### Live Updates

- Listens to module system events
- Auto-refreshes grid on plugin state changes
- Updates statistics in real-time
- Persists enabled state to configuration

## Best Practices

1. **Search before scrolling** - Use search bar for large plugin lists
2. **Use categories** - Filter by type (All, Enabled, Core, etc.)
3. **Export configs regularly** - Backup your configuration
4. **Check analyzer** - Use analyze button to inspect plugin code
5. **Read descriptions** - Hover over info icons for details

## Keyboard Shortcuts

Currently none - future enhancement opportunity.

## Troubleshooting

| Issue                        | Solution                                             |
| ---------------------------- | ---------------------------------------------------- |
| Plugin won't enable          | Check dependencies, view browser console for errors  |
| Settings not saving          | Verify localStorage is available                     |
| Grid not updating            | Click refresh or reload VRCX                         |
| Repository won't add         | Verify URL format, check network connectivity        |
| Import config fails          | Ensure JSON is valid, check file format              |

## Integration Points

### Required Dependencies

- **nav-menu-api** - Creates "Plugins" navigation tab
- **dialog-api** - Shows dialogs for settings and confirmations

### Optional Dependencies

- **plugin-analyzer** - Enables "Analyze" button for code inspection

## See Also

- [Plugin Analyzer](plugin-analyzer.md)
- [Dialog API](dialog-api.md)
- [Navigation Menu API](nav-menu-api.md)

