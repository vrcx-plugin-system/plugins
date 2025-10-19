# VRCX Protocol Links 🔗

Adds context menu items to copy VRChat protocol links and import commands.

## Overview

| Property         | Value                          |
| ---------------- | ------------------------------ |
| **ID**           | `protocol-links`               |
| **Category**     | Utility                        |
| **Tags**         | Utility, Links, Protocol       |
| **Dependencies** | `context-menu-api` (required)  |
| **Author**       | Bluscream                      |

## Features

- ✅ Copy user profile links
- ✅ Copy user import commands
- ✅ Copy avatar links
- ✅ Copy avatar import commands
- ✅ Copy world links  
- ✅ Copy world import commands
- ✅ Copy group links
- ✅ Automatic clipboard copying
- ✅ Context menu integration

## Context Menu Items

### User Menus

| Item              | Copies                                    |
| ----------------- | ----------------------------------------- |
| Copy User Link    | `vrchat://user/{userId}`                  |
| Copy User Import  | `/vrcx import user {userId}`              |

### Avatar Menus

| Item                | Copies                                  |
| ------------------- | --------------------------------------- |
| Copy Avatar Link    | `vrchat://avatar/{avatarId}`            |
| Copy Avatar Import  | `/vrcx import avatar {avatarId}`        |

### World Menus

| Item               | Copies                                   |
| ------------------ | ---------------------------------------- |
| Copy World Link    | `vrchat://launch?worldId={worldId}`      |
| Copy World Import  | `/vrcx import world {worldId}`           |

### Group Menus

| Item              | Copies                                    |
| ----------------- | ----------------------------------------- |
| Copy Group Link   | `vrchat://group/{groupId}`                |

## Usage

### From Context Menu

1. Right-click on user/world/avatar/group
2. Select appropriate copy option
3. Link or command copied to clipboard
4. Paste anywhere needed

### Programmatic Access

```javascript
const links = window.customjs.getModule('protocol-links');

// Copy user link
links.copyUserLink('usr_xxx-xxx-xxx');

// Copy world import command
links.copyWorldImport('wrld_xxx-xxx-xxx');
```

## Protocol Link Formats

### User

```
vrchat://user/{userId}
```

Opens user profile in VRChat client.

### Avatar

```
vrchat://avatar/{avatarId}
```

Opens avatar details in VRChat client.

### World

```
vrchat://launch?worldId={worldId}
```

Launches VRChat and joins the world.

### Group

```
vrchat://group/{groupId}
```

Opens group page in VRChat client.

## VRCX Import Commands

```
/vrcx import user {userId}
/vrcx import avatar {avatarId}
/vrcx import world {worldId}
```

These commands can be pasted into VRCX's search bar for quick imports.

## Implementation

Uses `window.customjs.utils.copyToClipboard()` for reliable clipboard access across different browser contexts.

## See Also

- [Context Menu API](context-menu-api.md)

