# Template Plugin 📄

A comprehensive template and example for creating new VRCX plugins.

## Overview

| Property         | Value                                  |
| ---------------- | -------------------------------------- |
| **ID**           | `template`                             |
| **Category**     | Development Template                   |
| **Tags**         | Template, Example, Development         |
| **Dependencies** | None                                   |
| **Author**       | Bluscream                              |

## Purpose

This plugin serves as a **complete reference implementation** showcasing:
- ✅ Plugin structure and organization
- ✅ Settings system with categories
- ✅ Action buttons
- ✅ Event system (emit and subscribe)
- ✅ Resource management
- ✅ Lifecycle methods
- ✅ Hook system examples
- ✅ Best practices

## Included Examples

### Settings Examples

| Setting Type | Example           | Description                    |
| ------------ | ----------------- | ------------------------------ |
| Boolean      | `featureEnabled`  | On/off toggle                  |
| String       | `username`        | Text input                     |
| Number       | `maxItems`        | Numeric input                  |
| Timespan     | `updateInterval`  | Time duration                  |
| Select       | `theme`           | Dropdown selection             |
| Slider       | `volume`          | Range slider with markers      |

### Category Examples

| Category  | Description                    |
| --------- | ------------------------------ |
| General   | Basic plugin configuration     |
| Advanced  | Advanced options for power users |

### Action Button Examples

| Button            | Purpose                        |
| ----------------- | ------------------------------ |
| Test Feature      | Demonstrates button callback   |
| Show Notification | Shows notification example     |
| Emit Event        | Demonstrates event emission    |

## Code Structure

```typescript
class TemplatePlugin extends CustomModule {
  constructor() {
    // Plugin metadata
  }
  
  async load() {
    // Define settings and categories
    // Setup initial state
  }
  
  async start() {
    // Start monitoring, timers, etc.
  }
  
  async stop() {
    // Cleanup resources
  }
  
  onLogin(user) {
    // Handle user login
  }
}
```

## Feature Examples

### Settings Categories

```typescript
this.categories = this.defineSettingsCategories({
  general: {
    name: "📄 General Settings",
    description: "Basic plugin configuration"
  },
  advanced: {
    name: "📄 Advanced Options",
    description: "Advanced configuration for power users"
  }
});
```

### Settings Definition

```typescript
this.settings = this.defineSettings({
  updateInterval: {
    type: SettingType.TIMESPAN,
    description: "How often to update",
    category: "general",
    default: 60000
  }
});
```

### Event System

```typescript
// Emit event
this.emit('template-event', { data: 'value' });

// Subscribe to event
this.subscribe('other-plugin-event', (data) => {
  console.log('Received:', data);
});
```

### Hook System

```typescript
// Pre-hook: runs before target function
this.registerPreHook('window.API.someMethod', (args) => {
  console.log('Method called with:', args);
});

// Post-hook: runs after target function
this.registerPostHook('window.API.someMethod', (result, args) => {
  console.log('Method returned:', result);
});
```

### Resource Management

```typescript
// Timers - auto-cleanup on plugin unload
const timer = setInterval(() => update(), 1000);
this.registerTimer(timer);

// Event listeners - auto-cleanup
this.registerListener(button, 'click', () => handleClick());

// Mutation observers - auto-cleanup
const observer = new MutationObserver(mutations => handle(mutations));
this.registerObserver(observer);
```

## Using This Template

1. Copy `template.ts` to `your-plugin-name.ts`
2. Update metadata (name, description, author, tags)
3. Define your settings
4. Add your action buttons
5. Implement lifecycle methods
6. Add your plugin logic
7. Export the class at the end

## Best Practices Demonstrated

1. **Type safety** - Full TypeScript typing
2. **Resource cleanup** - Using register methods
3. **Error handling** - Try-catch blocks
4. **Logging** - Consistent log messages
5. **Settings persistence** - Using settings store
6. **Event communication** - Using emit/subscribe
7. **Lifecycle management** - Proper load/start/stop

## What to Customize

| Section            | Action                                   |
| ------------------ | ---------------------------------------- |
| Metadata           | Change name, description, author, tags   |
| Dependencies       | Add required/optional dependencies       |
| Settings           | Define your configuration options        |
| Action Buttons     | Add your plugin's actions                |
| `load()`           | Initialize your plugin                   |
| `start()`          | Start your plugin's functionality        |
| `stop()`           | Cleanup your plugin's resources          |
| `onLogin()`        | Handle user login events                 |

## Example Plugins Built from Template

- Auto-Follow
- Auto-Invite
- Bio Updater
- Yoinker Detector
- Many others in this repository

## See Also

- [Plugin Development Guide](../../docs/plugins.md)
- [API Reference](../../docs/api-reference.md)

