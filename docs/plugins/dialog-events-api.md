# Dialog Events API 📢

Core API that tracks and emits events when VRCX native dialogs are opened, enabling plugins and VRCOSC modules to react to user interactions.

## Overview

| Property         | Value                                    |
| ---------------- | ---------------------------------------- |
| **ID**           | `dialog-events-api`                      |
| **Category**     | Core API                                 |
| **Tags**         | API, Core, Dialog, Events, Library       |
| **Dependencies** | None                                     |
| **Author**       | Bluscream                                |
| **Enabled**      | ✅ Yes (default enabled)                 |

## Features

- ✅ Tracks 21 different VRCX native dialog types
- ✅ Emits events with full dialog state references
- ✅ IPC broadcasting to VRCOSC modules
- ✅ Consolidated store subscriptions for performance
- ✅ Automatic tracking via Pinia store watchers
- ✅ Zero configuration required
- ✅ Event-driven architecture for loose coupling

## Available Events

All events broadcast via IPC and include full dialog references plus metadata.

### User & Social Dialogs (4)

| Event                            | Payload                                              | Description                     |
| -------------------------------- | ---------------------------------------------------- | ------------------------------- |
| `ShowUserDialog`                 | `userId`, `dialog`, `timestamp`                      | User profile dialog opened      |
| `ShowGroupDialog`                | `groupId`, `dialog`, `timestamp`                     | Group dialog opened             |
| `ShowModerateGroupDialog`        | `userId`, `dialog`, `timestamp`                      | Group moderation dialog opened  |
| `ShowGroupMemberModerationDialog`| `groupId`, `userId`, `dialog`, `timestamp`           | Member moderation dialog opened |

### Content Dialogs (4)

| Event                   | Payload                                                      | Description                  |
| ----------------------- | ------------------------------------------------------------ | ---------------------------- |
| `ShowWorldDialog`       | `worldId`, `shortName`, `dialog`, `timestamp`                | World dialog opened          |
| `ShowAvatarDialog`      | `avatarId`, `dialog`, `timestamp`                            | Avatar dialog opened         |
| `ShowAvatarAuthorDialog`| `refUserId`, `ownerUserId`, `currentAvatarImageUrl`, `timestamp` | Avatar author dialog opened  |
| `ShowLaunchDialog`      | `location`, `shortName`, `dialog`, `timestamp`               | VRChat launch dialog opened  |

### Import/Export Dialogs (4)

| Event                     | Payload                                         | Description                   |
| ------------------------- | ----------------------------------------------- | ----------------------------- |
| `ShowWorldImportDialog`   | `timestamp`                                     | World import dialog opened    |
| `ShowAvatarImportDialog`  | `timestamp`                                     | Avatar import dialog opened   |
| `ShowFriendImportDialog`  | `timestamp`                                     | Friend import dialog opened   |
| `ShowFavoriteDialog`      | `type`, `objectId`, `dialog`, `timestamp`       | Favorite dialog opened        |

### Media/Gallery Dialogs (2)

| Event                       | Payload                                              | Description                  |
| --------------------------- | ---------------------------------------------------- | ---------------------------- |
| `ShowFullscreenImageDialog` | `imageUrl`, `fileName`, `dialog`, `timestamp`        | Fullscreen image opened      |
| `ShowGalleryDialog`         | `dialog`, `timestamp`                                | Gallery dialog opened        |

### Settings/System Dialogs (5)

| Event                             | Payload                       | Description                        |
| --------------------------------- | ----------------------------- | ---------------------------------- |
| `ShowRegistryBackupDialog`        | `timestamp`                   | Registry backup dialog opened      |
| `ShowVRCXUpdateDialog`            | `dialog`, `timestamp`         | VRCX update dialog opened          |
| `ShowChangeLogDialog`             | `dialog`, `timestamp`         | Changelog dialog opened            |
| `ShowAvatarProviderDialog`        | `timestamp`                   | Avatar provider dialog opened      |
| `ShowPreviousInstancesInfoDialog` | `instanceId`, `timestamp`     | Previous instances dialog opened   |

### Notification/Message Dialogs (1)

| Event                          | Payload                 | Description                      |
| ------------------------------ | ----------------------- | -------------------------------- |
| `ShowEditInviteMessageDialog`  | `dialog`, `timestamp`   | Invite message editor opened     |

## Usage Examples

### Listen to Dialog Events (Plugin)

```typescript
// In your plugin's load() or start() method
this.on('ShowUserDialog', (data) => {
  console.log(`User dialog opened for: ${data.userId}`);
  console.log('Full dialog state:', data.dialog);
  console.log('Opened at:', new Date(data.timestamp));
});
```

### Listen to Multiple Dialog Events

```typescript
// Track when any avatar-related dialog opens
this.on('ShowAvatarDialog', (data) => {
  console.log('Avatar dialog:', data.avatarId);
  // Fetch additional avatar info, update UI, etc.
});

this.on('ShowAvatarAuthorDialog', (data) => {
  console.log('Avatar author dialog:', data.ownerUserId);
  // Track avatar author views
});
```

### World Dialog Tracking

```typescript
// Example: Tag manager listening for world dialogs
this.on('ShowWorldDialog', (data) => {
  const worldId = data.worldId;
  const shortName = data.shortName;
  
  // Inject custom tags, fetch world data, etc.
  this.processWorld(worldId);
});
```

### IPC Integration (VRCOSC Module)

When `broadcastIPC: true`, events are sent to VRCOSC modules via IPC:

```csharp
// C# VRCOSC Module example
public void HandleVRCXMessage(string data)
{
    var message = JsonSerializer.Deserialize<IpcMessage>(data);
    
    if (message.Type == "ShowUserDialog")
    {
        var userId = message.Data["userId"].ToString();
        // Set OSC parameter, send chatbox message, etc.
        SendOscMessage($"/chatbox/input", $"Viewing user: {userId}", true);
    }
}
```

### Conditional Logic Based on Dialogs

```typescript
// Yoinker detector plugin example
this.on('ShowUserDialog', (data) => {
  if (this.settings.store.checkOnDialogOpen) {
    this.processUserId(data.userId, "User Dialog Opened");
  }
});
```

## Event Payload Structure

### Full Dialog Reference

Each event with a `dialog` property includes the complete Pinia store state:

```typescript
{
  userId: "usr_xxx",        // ID field (varies by dialog type)
  dialog: {                 // Full dialog state from VRCX store
    id: "usr_xxx",
    visible: true,
    loading: false,
    ref: { /* VRChat API data */ },
    // ... all other dialog state properties
  },
  timestamp: 1234567890     // Unix timestamp in milliseconds
}
```

### Common Payload Fields

| Field       | Type     | Always Present | Description                              |
| ----------- | -------- | -------------- | ---------------------------------------- |
| `timestamp` | `number` | ✅ Yes         | Unix timestamp when dialog was opened    |
| `dialog`    | `object` | ⚠️ Most       | Full Pinia store state (when applicable) |
| `*Id`       | `string` | ⚠️ Varies     | Relevant ID (userId, worldId, etc.)      |

## Implementation Details

### Store Subscriptions

The plugin uses Pinia store subscriptions to watch for dialog visibility changes:

```typescript
// Example: Watching USER store
this.subscribe('USER', ({ userDialog }) => {
  if (userDialog?.visible && userDialog?.id) {
    this.emit('ShowUserDialog', {
      userId: userDialog.id,
      dialog: userDialog,
      timestamp: Date.now()
    });
  }
});
```

### Performance Optimizations

- ✅ **Consolidated subscriptions**: Multiple dialogs from the same store use one subscription
- ✅ **Visibility checks**: Only emit when dialog is actually visible
- ✅ **ID validation**: Only emit when required IDs are present
- ✅ **Single source of truth**: All dialog tracking in one plugin

### Store Mapping

| VRCX Store       | Dialogs Tracked                                                     |
| ---------------- | ------------------------------------------------------------------- |
| `USER`           | ShowUserDialog                                                      |
| `WORLD`          | ShowWorldDialog                                                     |
| `AVATAR`         | ShowAvatarDialog, ShowAvatarAuthorDialog                            |
| `GROUP`          | ShowGroupDialog, ShowModerateGroupDialog, ShowGroupMemberModeration |
| `LAUNCH`         | ShowLaunchDialog                                                    |
| `GALLERY`        | ShowGalleryDialog, ShowFullscreenImageDialog                        |
| `FAVORITE`       | ShowFavoriteDialog, ShowWorldImportDialog, ShowAvatarImportDialog, ShowFriendImportDialog |
| `INSTANCE`       | ShowPreviousInstancesInfoDialog                                     |
| `VRCX`           | ShowRegistryBackupDialog                                            |
| `VRCXUPDATER`    | ShowVRCXUpdateDialog, ShowChangeLogDialog                           |
| `INVITE`         | ShowEditInviteMessageDialog                                         |
| `AVATARPROVIDER` | ShowAvatarProviderDialog                                            |

## Dependent Plugins

These plugins require `dialog-events-api`:

| Plugin            | Usage                                        |
| ----------------- | -------------------------------------------- |
| `tag-api`         | Listens to `ShowWorldDialog` to inject tags  |
| `yoinker-detector`| Listens to `ShowUserDialog` to check users   |
| `avatar-log`      | Listens to `ShowAvatarDialog` to log avatars |

## Console Logging

All events log to console **EXCEPT** `ShowUserDialog` (VRCX already logs this).

Control logging via:
- Individual event's `logToConsole` setting
- Plugin enable/disable state

## IPC Broadcasting

All 21 events have `broadcastIPC: true`, enabling:
- ✅ VRCOSC module integration
- ✅ External application monitoring
- ✅ Cross-application automation
- ✅ OSC parameter control based on UI actions

## Best Practices

1. **Listen only to needed events** - Don't subscribe to all events if you only need specific ones
2. **Check dialog.visible** - When accessing dialog state directly, verify it's still visible
3. **Use provided IDs** - Event payloads include pre-extracted IDs for convenience
4. **Access full state via dialog** - The `dialog` object has complete Pinia state
5. **Handle timing** - Events fire when dialog becomes visible, not when data loads

## Troubleshooting

| Issue                          | Solution                                                |
| ------------------------------ | ------------------------------------------------------- |
| Events not firing              | Check if `dialog-events-api` is enabled                 |
| Missing event data             | Verify you're accessing correct payload fields          |
| Duplicate events               | Check if multiple plugins are listening to same event   |
| IPC not receiving events       | Verify VRCOSC module is connected and parsing correctly |
| Dialog state is undefined      | Some dialogs don't have full state (check event table)  |

## See Also

- **[dialog-api](dialog-api.md)** - Create custom dialogs in VRCX
- **[tag-api](tag-api.md)** - Uses ShowWorldDialog for tag injection
- **[Dialogs CSV](../../docs/dialogs.csv)** - Complete list of VRCX dialogs
- **CustomModule.on()** - Subscribe to events in your plugin
- **CustomModule.emit()** - Emit events from your plugin

## Architecture Benefits

### Before (Manual Subscriptions)

```typescript
// Each plugin duplicated store subscriptions
this.subscribe('USER', ({ userDialog }) => { /* ... */ });
this.subscribe('WORLD', ({ worldDialog }) => { /* ... */ });
this.subscribe('AVATAR', ({ avatarDialog }) => { /* ... */ });
```

### After (Event-Driven)

```typescript
// Plugins listen to events from one source
this.on('ShowUserDialog', (data) => { /* ... */ });
this.on('ShowWorldDialog', (data) => { /* ... */ });
this.on('ShowAvatarDialog', (data) => { /* ... */ });
```

**Benefits:**
- ✅ Single source of truth for dialog tracking
- ✅ Reduced store subscription overhead
- ✅ Easier to maintain and extend
- ✅ Consistent event payload structure
- ✅ Decoupled plugin architecture

