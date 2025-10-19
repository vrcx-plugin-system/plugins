# Dialog API 💬

Core API for creating and managing custom dialogs in VRCX with Element Plus integration.

## Overview

| Property         | Value                      |
| ---------------- | -------------------------- |
| **ID**           | `dialog-api`               |
| **Category**     | Core API                   |
| **Tags**         | API, Core, Dialog, Library |
| **Dependencies** | None                       |
| **Author**       | Bluscream                  |

## Features

- ✅ Element Plus dialog integration
- ✅ Custom dialog registration and management
- ✅ Modal and non-modal dialogs
- ✅ Draggable dialogs
- ✅ Fullscreen support
- ✅ Lifecycle callbacks (onOpen, onClose, beforeClose)
- ✅ Fallback to native confirm/alert/prompt
- ✅ Automatic cleanup on plugin unload

## Core Methods

| Method            | Parameters                           | Returns                     | Description                   |
| ----------------- | ------------------------------------ | --------------------------- | ----------------------------- |
| `registerDialog`  | `id: string, options: DialogOptions` | `DialogController`          | Register a custom dialog      |
| `showDialog`      | `dialogId: string`                   | `boolean`                   | Show a registered dialog      |
| `closeDialog`     | `dialogId: string`                   | `boolean`                   | Close a dialog                |
| `toggleDialog`    | `dialogId: string`                   | `void`                      | Toggle dialog visibility      |
| `destroyDialog`   | `dialogId: string`                   | `void`                      | Remove dialog and cleanup     |
| `isDialogVisible` | `dialogId: string`                   | `boolean`                   | Check if dialog is visible    |
| `getAllDialogIds` | -                                    | `string[]`                  | Get all registered dialog IDs |
| `getDialog`       | `dialogId: string`                   | `CustomDialog \| undefined` | Get dialog by ID              |

### Helper Methods (with Native Fallbacks)

| Method                   | Parameters                                         | Returns                   | Description              |
| ------------------------ | -------------------------------------------------- | ------------------------- | ------------------------ |
| `showConfirmDialogAsync` | `title, message, type?, confirmText?, cancelText?` | `Promise<boolean>`        | Show confirmation dialog |
| `showAlertDialogAsync`   | `title, message, type?, confirmText?`              | `Promise<void>`           | Show alert dialog        |
| `showPromptDialogAsync`  | `title, message, defaultValue?`                    | `Promise<string \| null>` | Show input prompt dialog |

## DialogOptions Interface

| Property             | Type                    | Default  | Description                       |
| -------------------- | ----------------------- | -------- | --------------------------------- |
| `title`              | `string`                | -        | Dialog title                      |
| `content`            | `string \| HTMLElement` | -        | Dialog content                    |
| `width`              | `string`                | `'50%'`  | Dialog width                      |
| `showClose`          | `boolean`               | `true`   | Show close button                 |
| `closeOnClickModal`  | `boolean`               | `false`  | Close when clicking modal overlay |
| `closeOnPressEscape` | `boolean`               | `true`   | Close on ESC key                  |
| `fullscreen`         | `boolean`               | `false`  | Fullscreen mode                   |
| `top`                | `string`                | `'15vh'` | Top margin                        |
| `modal`              | `boolean`               | `true`   | Show modal overlay                |
| `draggable`          | `boolean`               | `false`  | Make dialog draggable             |
| `footer`             | `string \| HTMLElement` | -        | Custom footer content             |
| `beforeClose`        | `() => boolean \| void` | -        | Callback before closing           |
| `onOpen`             | `() => void`            | -        | Callback when opened              |
| `onClose`            | `() => void`            | -        | Callback when closed              |

## DialogController Interface

| Method                | Returns   | Description           |
| --------------------- | --------- | --------------------- |
| `show()`              | `boolean` | Show the dialog       |
| `hide()`              | `boolean` | Hide the dialog       |
| `toggle()`            | `void`    | Toggle visibility     |
| `setTitle(title)`     | `void`    | Update dialog title   |
| `setContent(content)` | `void`    | Update dialog content |
| `isVisible()`         | `boolean` | Check if visible      |
| `destroy()`           | `void`    | Remove and cleanup    |

## Usage Examples

### Basic Dialog

```typescript
const dialogApi = window.customjs.getModule("dialog-api");

const controller = dialogApi.registerDialog("my-dialog", {
  title: "Hello World",
  content: "<p>This is a custom dialog!</p>",
  width: "400px",
});

controller.show();
```

### Dialog with HTML Content

```typescript
const content = document.createElement("div");
content.innerHTML = "<h3>Custom Content</h3><p>More details here...</p>";

dialogApi.registerDialog("custom-dialog", {
  title: "Custom Dialog",
  content: content,
  width: "600px",
  modal: true,
});
```

### Confirmation Dialog

```typescript
const result = await dialogApi.showConfirmDialogAsync(
  "Confirm Action",
  "Are you sure you want to continue?",
  "warning",
  "Yes, Continue",
  "Cancel"
);

if (result) {
  // User confirmed
} else {
  // User cancelled
}
```

### Alert Dialog

```typescript
await dialogApi.showAlertDialogAsync(
  "Success",
  "Operation completed successfully!",
  "success",
  "OK"
);
```

### Prompt Dialog

```typescript
const userName = await dialogApi.showPromptDialogAsync(
  "Enter Name",
  "Please enter your username:",
  "DefaultUser"
);

if (userName !== null) {
  console.log("User entered:", userName);
}
```

### Dialog with Lifecycle Callbacks

```typescript
const controller = dialogApi.registerDialog("lifecycle-dialog", {
  title: "Lifecycle Demo",
  content: "<p>Watch the console!</p>",
  onOpen: () => console.log("Dialog opened!"),
  onClose: () => console.log("Dialog closed!"),
  beforeClose: () => {
    // Return false to prevent closing
    return confirm("Really close this dialog?");
  },
});

controller.show();
```

### Fullscreen Dialog

```typescript
dialogApi
  .registerDialog("fullscreen-dialog", {
    title: "Fullscreen View",
    content: myLargeContentElement,
    fullscreen: true,
    closeOnClickModal: false,
  })
  .show();
```

## Implementation Details

### Element Plus Integration

The plugin attempts to use Element Plus dialogs via:

```typescript
window.$app?.config?.globalProperties?.$confirm;
window.$app?.config?.globalProperties?.$alert;
window.$app?.config?.globalProperties?.$prompt;
```

### Native Fallbacks

If Element Plus is unavailable, automatically falls back to:

- `confirm()` for confirmations
- `alert()` for alerts
- `prompt()` for prompts

### Dialog Wrapper

Creates a persistent wrapper element in the DOM to host custom dialogs:

- ID: `vrcx-custom-dialogs`
- Position: Fixed overlay
- Z-index: High value to appear above other content

## Best Practices

1. **Always destroy dialogs** when your plugin unloads
2. **Use unique dialog IDs** to avoid conflicts
3. **Provide onClose callbacks** for cleanup
4. **Test with Element Plus unavailable** to ensure fallbacks work
5. **Use modal: true** for important confirmations

## Troubleshooting

| Issue                               | Solution                                                    |
| ----------------------------------- | ----------------------------------------------------------- |
| Dialog not showing                  | Check if Element Plus is loaded, verify dialog ID is unique |
| Multiple dialogs stacking           | Destroy old dialogs before creating new ones                |
| Dialog persists after plugin reload | Implement proper cleanup in `stop()` method                 |
| Callbacks not firing                | Verify callback functions are properly bound                |

## See Also

- **CustomModule.showConfirmDialog()** - Simplified confirm with auto-fallback
- **CustomModule.showAlertDialog()** - Simplified alert with auto-fallback
