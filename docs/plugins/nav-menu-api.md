# Navigation Menu API 🧭

Core API for adding custom tabs and content to the VRCX navigation menu.

## Overview

| Property | Value |
|----------|-------|
| **ID** | `nav-menu-api` |
| **Category** | Core API |
| **Tags** | API, Core, Navigation, UI |
| **Dependencies** | None |
| **Author** | Bluscream |

## Features

- ✅ Add custom navigation tabs
- ✅ Register tab content (HTML or HTMLElement)
- ✅ onShow/onHide callbacks for tabs
- ✅ Automatic DOM mutation watching
- ✅ Tab click handling
- ✅ Icon and badge support
- ✅ Automatic cleanup on plugin unload

## Core Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `addItem` | `id, label, icon?, content?, callbacks?` | `boolean` | Add navigation menu item |
| `removeItem` | `id: string` | `boolean` | Remove navigation menu item |
| `getItem` | `id: string` | `NavMenuItem \| undefined` | Get menu item by ID |
| `getAllItems` | - | `Map<string, NavMenuItem>` | Get all registered items |
| `isItemVisible` | `id: string` | `boolean` | Check if item's content is visible |

## NavMenuItem Interface

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique identifier |
| `label` | `string` | Display text |
| `icon` | `string?` | RemixIcon class (e.g., 'ri-home-line') |
| `content` | `string \| HTMLElement?` | Tab content |
| `onShow` | `() => void?` | Callback when tab shown |
| `onHide` | `() => void?` | Callback when tab hidden |
| `rendered` | `boolean` | Whether item is in DOM |
| `contentRendered` | `boolean` | Whether content is in DOM |

## Usage Examples

### Add Simple Tab

```typescript
const navApi = window.customjs.getModule('nav-menu-api');

navApi.addItem(
  'my-tab',              // ID
  'My Tab',              // Label
  'ri-star-line',        // Icon
  '<h1>Tab Content</h1>' // Content
);
```

### Add Tab with HTMLElement Content

```typescript
const content = document.createElement('div');
content.innerHTML = '<h2>Custom Content</h2><p>More details...</p>';

navApi.addItem('custom-tab', 'Custom', 'ri-settings-line', content);
```

### Add Tab with Callbacks

```typescript
navApi.addItem(
  'dynamic-tab',
  'Dynamic',
  'ri-refresh-line',
  contentElement,
  {
    onShow: () => {
      console.log('Tab is now visible!');
      // Load data, start timers, etc.
    },
    onHide: () => {
      console.log('Tab is now hidden!');
      // Pause updates, cleanup, etc.
    }
  }
);
```

### Check Tab Visibility

```typescript
const navApi = window.customjs.getModule('nav-menu-api');

if (navApi.isItemVisible('my-tab')) {
  console.log('My tab is currently visible!');
}
```

### Remove Tab

```typescript
const navApi = window.customjs.getModule('nav-menu-api');
navApi.removeItem('my-tab');
```

## Implementation Details

### DOM Structure

The API watches for VRCX's navigation structure:
```
.x-friend-location > nav > .el-menu (navigation menu)
.x-friend-location-content         (content area)
```

### Mutation Observers

- **Menu Observer**: Watches for navigation menu changes
- **Content Observer**: Watches for content area changes
- **Both auto-cleanup** when plugin unloads

### Tab Rendering

1. Creates `<li>` element with class `el-menu-item`
2. Adds icon (if provided) as `<i>` with RemixIcon classes
3. Adds click handler to show corresponding content
4. Content is wrapped in div with ID `customjs-content-{id}`

### User Change Detection

On user login, sets up watchers for:
- Menu structure changes
- Content area updates
- Tab visibility changes

## Best Practices

1. **Use unique IDs** - prefix with your plugin name (e.g., `myplugin-settings`)
2. **Cleanup on unload** - Call `removeItem()` in your plugin's `stop()` method
3. **Check visibility** - Use `onShow`/`onHide` to optimize resource usage
4. **Wait for ready** - Add nav items in `start()` method, not `load()`
5. **Handle re-renders** - VRCX may rebuild nav menu, callbacks handle this automatically

## Common Patterns

### Lazy-load Content

```typescript
let contentLoaded = false;

navApi.addItem('lazy-tab', 'Lazy Tab', 'ri-file-line', '<p>Loading...</p>', {
  onShow: async () => {
    if (!contentLoaded) {
      const data = await fetchMyData();
      const content = buildMyContent(data);
      navApi.getItem('lazy-tab').content = content;
      contentLoaded = true;
    }
  }
});
```

### Tab with Auto-refresh

```typescript
let refreshTimer = null;

navApi.addItem('auto-refresh', 'Live Data', 'ri-refresh-line', contentElement, {
  onShow: () => {
    // Start auto-refresh when visible
    refreshTimer = setInterval(() => updateContent(), 5000);
  },
  onHide: () => {
    // Stop auto-refresh when hidden
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }
});
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Tab not appearing | Check if nav menu exists, verify ID is unique |
| Content not showing | Ensure content is set, check browser console for errors |
| Callbacks not firing | Verify VRCX nav structure hasn't changed |
| Tab persists after unload | Call `removeItem()` in plugin's `stop()` method |

## Integration with Other APIs

Works seamlessly with:
- **Plugin Manager UI** - Uses this API to add "Plugins" tab
- **DevTools Button** - Uses this API to add "DevTools" tab
- **Start Game Button** - Uses this API to add "Start Game" tab

## See Also

- [Plugin Manager UI](plugin-manager-ui.md)
- [DevTools Button](devtools-button.md)
- [Start Game Button](start-game-button.md)

