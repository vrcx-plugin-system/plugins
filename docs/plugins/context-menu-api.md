# Context Menu API 📋

Custom context menu management for VRCX user, world, avatar, group, and instance dialogs.

## Overview

| Property         | Value                        |
| ---------------- | ---------------------------- |
| **ID**           | `context-menu-api`           |
| **Category**     | Core API                     |
| **Tags**         | API, Core, Context, Library  |
| **Dependencies** | None                         |
| **Author**       | Bluscream                    |

## Features

- ✅ Add custom items to user context menus
- ✅ Add custom items to world context menus
- ✅ Add custom items to avatar context menus
- ✅ Add custom items to group context menus
- ✅ Add custom items to instance context menus
- ✅ Icon support with RemixIcon
- ✅ Click callbacks with dialog data
- ✅ Automatic DOM mutation watching
- ✅ Duplicate prevention
- ✅ Automatic cleanup on plugin unload

## Supported Menu Types

| Menu Type  | Triggered By                        |
| ---------- | ----------------------------------- |
| `user`     | Clicking on user names/avatars      |
| `world`    | Clicking on world listings          |
| `avatar`   | Clicking on avatar listings         |
| `group`    | Clicking on group listings          |
| `instance` | Clicking on instance join buttons   |

## Core Methods

| Method                | Parameters                         | Returns   | Description                      |
| --------------------- | ---------------------------------- | --------- | -------------------------------- |
| `addUserItem`         | `id, label, icon?, onClick`        | `boolean` | Add item to user context menu    |
| `addWorldItem`        | `id, label, icon?, onClick`        | `boolean` | Add item to world context menu   |
| `addAvatarItem`       | `id, label, icon?, onClick`        | `boolean` | Add item to avatar context menu  |
| `addGroupItem`        | `id, label, icon?, onClick`        | `boolean` | Add item to group context menu   |
| `addInstanceItem`     | `id, label, icon?, onClick`        | `boolean` | Add item to instance context menu|
| `removeUserItem`      | `id: string`                       | `boolean` | Remove user menu item            |
| `removeWorldItem`     | `id: string`                       | `boolean` | Remove world menu item           |
| `removeAvatarItem`    | `id: string`                       | `boolean` | Remove avatar menu item          |
| `removeGroupItem`     | `id: string`                       | `boolean` | Remove group menu item           |
| `removeInstanceItem`  | `id: string`                       | `boolean` | Remove instance menu item        |

## Dialog Data Interface

Each context menu callback receives relevant data based on menu type:

### User Menu Data

| Property            | Type     | Description            |
| ------------------- | -------- | ---------------------- |
| `userId`            | `string` | VRChat user ID         |
| `displayName`       | `string` | User display name      |
| `currentAvatarImageUrl` | `string?` | Avatar thumbnail   |

### World Menu Data

| Property       | Type     | Description           |
| -------------- | -------- | --------------------- |
| `worldId`      | `string` | VRChat world ID       |
| `worldName`    | `string` | World name            |
| `authorId`     | `string?` | World author user ID |

### Avatar Menu Data

| Property       | Type     | Description          |
| -------------- | -------- | -------------------- |
| `avatarId`     | `string` | VRChat avatar ID     |
| `avatarName`   | `string` | Avatar name          |
| `authorId`     | `string?` | Avatar author ID    |

### Group Menu Data

| Property      | Type     | Description         |
| ------------- | -------- | ------------------- |
| `groupId`     | `string` | VRChat group ID     |
| `groupName`   | `string` | Group name          |

## Usage Examples

### Add User Menu Item

```typescript
const contextApi = window.customjs.getModule('context-menu-api');

contextApi.addUserItem(
  'copy-user-id',
  'Copy User ID',
  'ri-file-copy-line',
  (userData) => {
    navigator.clipboard.writeText(userData.userId);
    console.log('Copied:', userData.userId);
  }
);
```

### Add World Menu Item

```typescript
contextApi.addWorldItem(
  'open-world-page',
  'Open in Browser',
  'ri-external-link-line',
  (worldData) => {
    const url = `https://vrchat.com/home/world/${worldData.worldId}`;
    window.open(url, '_blank');
  }
);
```

### Add Avatar Menu Item

```typescript
contextApi.addAvatarItem(
  'favorite-avatar',
  'Add to Favorites',
  'ri-heart-line',
  async (avatarData) => {
    await window.API.saveFavoriteAvatar({
      avatarId: avatarData.avatarId,
      tags: ['favorite']
    });
  }
);
```

### Remove Menu Item

```typescript
const contextApi = window.customjs.getModule('context-menu-api');

// Remove from all user context menus
contextApi.removeUserItem('my-custom-item');
```

### Access Full Dialog Data

```typescript
contextApi.addUserItem(
  'detailed-info',
  'Show Details',
  'ri-information-line',
  (userData) => {
    console.log('User ID:', userData.userId);
    console.log('Display Name:', userData.displayName);
    console.log('Avatar Image:', userData.currentAvatarImageUrl);
    // userData contains all Pinia state for this user dialog
  }
);
```

## Implementation Details

### Pinia Integration

Extracts dialog data from Vue/Pinia state:
```typescript
window.$pinia?.user?.userDialog
window.$pinia?.world?.worldDialog
window.$pinia?.avatar?.avatarDialog
window.$pinia?.group?.groupDialog
```

### Mutation Observer

- Watches for dialog elements appearing in DOM
- Detects dialogs by class patterns (e.g., `user-dialog-*`)
- Debounces menu injection to prevent duplicates
- Auto-cleans up when dialogs close

### Menu Injection

1. Finds footer element in dialog
2. Creates button container
3. Adds custom buttons with icons
4. Binds click handlers with dialog data

### Duplicate Prevention

- Tracks processed menu instances by ID
- Skips already-processed dialogs
- Clears tracking when dialogs close

## Best Practices

1. **Use descriptive IDs** - prefix with your plugin name
2. **Provide icons** - improves visual clarity
3. **Handle async operations** - use `async` callbacks for API calls
4. **Clean up on unload** - call `removeXItem()` in `stop()` method
5. **Check data availability** - verify required fields exist before using

## Common Patterns

### Copy to Clipboard

```typescript
contextApi.addUserItem('copy-name', 'Copy Name', 'ri-clipboard-line', (data) => {
  window.customjs.utils.copyToClipboard(data.displayName);
});
```

### Open External Link

```typescript
contextApi.addUserItem('open-profile', 'VRChat Profile', 'ri-link', (data) => {
  window.open(`https://vrchat.com/home/user/${data.userId}`, '_blank');
});
```

### Conditional Item Visibility

```typescript
// Only show for specific users
contextApi.addUserItem('admin-actions', 'Admin Tools', 'ri-admin-line', (data) => {
  const adminUsers = ['usr_xxx', 'usr_yyy'];
  
  if (!adminUsers.includes(data.userId)) {
    console.log('Not an admin user');
    return;
  }
  
  // Show admin menu
  showAdminDialog(data);
});
```

## Troubleshooting

| Issue                     | Solution                                      |
| ------------------------- | --------------------------------------------- |
| Menu items not appearing  | Check if dialog-api is loaded, verify menu type |
| Duplicate menu items      | Use unique IDs, check if already registered  |
| Callbacks not firing      | Verify Pinia state structure hasn't changed  |
| Items persist after unload| Call remove methods in plugin's `stop()`     |

## Integration with Other Plugins

Used by:
- **Auto Follow** - Adds follow/unfollow menu items
- **Auto Invite** - Adds invite menu items
- **Protocol Links** - Adds copy link/import menu items
- **Tag Manager** - May add tagging menu items

## See Also

- [Auto Follow](auto-follow.md)
- [Auto Invite](auto-invite.md)
- [Protocol Links](protocol-links.md)

