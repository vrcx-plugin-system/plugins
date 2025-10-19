# Dialog API Test 🧪

Test plugin demonstrating all dialog-api features and capabilities.

## Overview

| Property         | Value                              |
| ---------------- | ---------------------------------- |
| **ID**           | `dialog-api-test`                  |
| **Category**     | Test Plugin                        |
| **Tags**         | Test, Example, Dialog, Development |
| **Dependencies** | `dialog-api` (required)            |
| **Author**       | Bluscream                          |

## Purpose

Demonstrates and tests Dialog API features:
- Simple dialogs
- Custom styled dialogs
- Fullscreen dialogs
- Dialogs with lifecycle callbacks
- Modal and non-modal dialogs
- Draggable dialogs

## Action Buttons

| Button                  | Description                          |
| ----------------------- | ------------------------------------ |
| **Show Simple Dialog**  | Shows basic dialog example           |
| **Show Custom Dialog**  | Shows styled dialog with HTML        |
| **Show Fullscreen**     | Shows fullscreen dialog              |
| **Show Non-Modal**      | Shows non-modal (background visible) |
| **Show with Callbacks** | Shows dialog with lifecycle hooks    |
| **Show Draggable**      | Shows draggable dialog               |

## Settings

| Setting       | Type    | Default | Description                      |
| ------------- | ------- | ------- | -------------------------------- |
| `showOnLogin` | Boolean | `false` | Show welcome dialog on login     |

## Usage

### Test Dialogs

1. Enable the plugin
2. Click any action button
3. Observe dialog behavior
4. Check console for lifecycle logs

### For Developers

Study `dialog-api-test.ts` source code to learn:
- How to create different dialog types
- How to handle callbacks
- How to build custom content
- How to manage dialog lifecycle

## Dialog Examples Included

### Simple Dialog

Basic dialog with text content and title.

### Custom Styled Dialog

HTML content with custom CSS styling and formatting.

### Fullscreen Dialog

Takes over entire VRCX window.

### Non-Modal Dialog

Allows interaction with VRCX behind the dialog.

### Callback Dialog

Demonstrates `onOpen`, `onClose`, and `beforeClose` callbacks.

### Draggable Dialog

User can drag the dialog around the screen.

## Best Practices

1. **Disable after learning** - Not needed in normal use
2. **Study the code** - Best way to learn dialog-api
3. **Experiment** - Modify and test different options

## See Also

- [Dialog API](dialog-api.md) - Full dialog API documentation
- [Template Plugin](template.md) - General plugin template

